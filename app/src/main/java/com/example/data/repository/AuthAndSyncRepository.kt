package com.example.data.repository

import android.app.Activity
import android.content.Context
import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.example.data.model.MinistryEntry
import com.example.data.model.MinistryType
import com.example.data.model.PublisherStatus
import com.example.data.model.ScheduledEvent
import com.example.data.model.UserSettings
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseNetworkException
import com.google.firebase.FirebaseOptions
import com.google.firebase.auth.AuthCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.OAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AuthAndSyncRepository(
    private val context: Context,
    private val ministryRepository: MinistryRepository,
    private val scheduledEventRepository: ScheduledEventRepository,
    private val settingsRepository: SettingsRepository
) {
    init {
        ensureFirebaseInitialized()
    }

    private fun ensureFirebaseInitialized() {
        try {
            if (FirebaseApp.getApps(context).isEmpty()) {
                try {
                    FirebaseApp.initializeApp(context)
                } catch (e: Exception) {
                    val options = FirebaseOptions.Builder()
                        .setApplicationId("1:481143643003:android:be9351059f674ed3")
                        .setApiKey("AIzaSyB-PlaceholderApiKeyForMinistryTracker")
                        .setProjectId("ministry-tracker-app")
                        .setDatabaseUrl("https://ministry-tracker-app.firebaseio.com")
                        .setStorageBucket("ministry-tracker-app.appspot.com")
                        .build()
                    FirebaseApp.initializeApp(context, options)
                }
            }
        } catch (e: Exception) {
            Log.w("AuthAndSyncRepository", "Firebase auto-init: ${e.message}")
        }
    }

    val auth: FirebaseAuth?
        get() {
            return try {
                ensureFirebaseInitialized()
                FirebaseAuth.getInstance()
            } catch (e: Exception) {
                Log.w("AuthAndSyncRepository", "FirebaseAuth init error: ${e.message}")
                null
            }
        }

    private val firestore: FirebaseFirestore?
        get() {
            return try {
                ensureFirebaseInitialized()
                FirebaseFirestore.getInstance()
            } catch (e: Exception) {
                Log.w("AuthAndSyncRepository", "FirebaseFirestore init error: ${e.message}")
                null
            }
        }

    val currentUser: FirebaseUser?
        get() = auth?.currentUser

    val authStateFlow: Flow<FirebaseUser?> = callbackFlow {
        val firebaseAuth = auth
        if (firebaseAuth == null) {
            trySend(null)
            close()
            return@callbackFlow
        }
        val listener = FirebaseAuth.AuthStateListener { fa ->
            trySend(fa.currentUser)
        }
        firebaseAuth.addAuthStateListener(listener)
        trySend(firebaseAuth.currentUser)
        awaitClose {
            firebaseAuth.removeAuthStateListener(listener)
        }
    }

    fun isUserSignedIn(): Boolean {
        return auth?.currentUser != null
    }

    /**
     * Resolves the Web Client ID for Google Sign-In.
     * Checks configured preference first, then google-services.json string resource.
     */
    fun getWebClientId(): String {
        // 1. Check user-saved client ID
        val prefs = context.getSharedPreferences("ministry_auth_prefs", Context.MODE_PRIVATE)
        val customId = prefs.getString("custom_web_client_id", null)
        if (!customId.isNullOrBlank()) {
            return customId.trim()
        }

        // 2. Check auto-generated resource from google-services.json
        try {
            val resId = context.resources.getIdentifier("default_web_client_id", "string", context.packageName)
            if (resId != 0) {
                val clientId = context.getString(resId)
                if (clientId.isNotBlank()) {
                    return clientId.trim()
                }
            }
        } catch (e: Exception) {
            Log.d("AuthAndSyncRepository", "default_web_client_id not located in string resources")
        }
        return ""
    }

    fun saveCustomWebClientId(clientId: String) {
        val prefs = context.getSharedPreferences("ministry_auth_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("custom_web_client_id", clientId.trim()).apply()
    }

    /**
     * Real Google Sign-In using Credential Manager & Firebase Authentication.
     */
    suspend fun signInWithGoogle(activity: Activity): Result<FirebaseUser> = withContext(Dispatchers.IO) {
        val firebaseAuth = auth ?: return@withContext Result.failure(
            Exception("Firebase Authentication could not be started. Please check network connectivity.")
        )

        val serverClientId = getWebClientId()
        if (serverClientId.isBlank()) {
            return@withContext Result.failure(
                Exception("Google Sign-In is not yet configured with a Web Client ID. Please configure it in Settings > Cloud Sync or provide google-services.json.")
            )
        }

        try {
            val credentialManager = CredentialManager.create(activity)
            val googleIdOption = GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)
                .setServerClientId(serverClientId)
                .setAutoSelectEnabled(false)
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()

            val result = withContext(Dispatchers.Main) {
                credentialManager.getCredential(request = request, context = activity)
            }

            val credential = result.credential
            val idToken = if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                googleIdTokenCredential.idToken
            } else {
                return@withContext Result.failure(Exception("Unable to obtain Google credentials."))
            }

            val authCredential = GoogleAuthProvider.getCredential(idToken, null)
            val user = performSignInOrLink(firebaseAuth, authCredential)

            if (user != null) {
                val email = user.email
                val name = user.displayName ?: (if (!email.isNullOrBlank()) email.substringBefore("@") else "Publisher")
                settingsRepository.updateUserInfo(email, name, isGuest = false)

                // Auto-sync after authentication
                try {
                    syncWithFirebase()
                } catch (syncErr: Exception) {
                    Log.w("AuthAndSyncRepository", "Post-login sync deferred: ${syncErr.message}")
                }
                Result.success(user)
            } else {
                Result.failure(Exception("Sign in completed without user profile."))
            }
        } catch (e: Exception) {
            val friendlyError = mapAuthError(e, "Google Sign-In")
            Log.e("AuthAndSyncRepository", "Google sign-in error", e)
            Result.failure(Exception(friendlyError))
        }
    }

    /**
     * Real Sign in with Apple using Firebase OAuthProvider.
     */
    suspend fun signInWithApple(activity: Activity): Result<FirebaseUser> = withContext(Dispatchers.IO) {
        val firebaseAuth = auth ?: return@withContext Result.failure(
            Exception("Firebase Authentication is not available.")
        )

        try {
            val provider = OAuthProvider.newBuilder("apple.com").apply {
                scopes = listOf("email", "name")
            }

            val pending = firebaseAuth.pendingAuthResult
            val authResult = if (pending != null) {
                pending.await()
            } else {
                withContext(Dispatchers.Main) {
                    firebaseAuth.startActivityForSignInWithProvider(activity, provider.build()).await()
                }
            }

            val user = authResult.user
            if (user != null) {
                val email = user.email
                val name = user.displayName ?: (if (!email.isNullOrBlank()) email.substringBefore("@") else "Apple User")
                settingsRepository.updateUserInfo(email, name, isGuest = false)

                // Auto-sync after authentication
                try {
                    syncWithFirebase()
                } catch (syncErr: Exception) {
                    Log.w("AuthAndSyncRepository", "Post-login sync deferred: ${syncErr.message}")
                }
                Result.success(user)
            } else {
                Result.failure(Exception("Apple sign-in completed without user profile."))
            }
        } catch (e: Exception) {
            val friendlyError = mapAuthError(e, "Apple Sign-In")
            Log.e("AuthAndSyncRepository", "Apple sign-in error", e)
            Result.failure(Exception(friendlyError))
        }
    }

    /**
     * Helper to sign in or link credential with current Firebase account.
     */
    private suspend fun performSignInOrLink(
        firebaseAuth: FirebaseAuth,
        credential: AuthCredential
    ): FirebaseUser? {
        val current = firebaseAuth.currentUser
        return if (current != null && !current.isAnonymous) {
            try {
                val linkResult = current.linkWithCredential(credential).await()
                linkResult.user ?: current
            } catch (collision: FirebaseAuthUserCollisionException) {
                // If already associated, sign in to that account directly
                val authResult = firebaseAuth.signInWithCredential(credential).await()
                authResult.user
            }
        } else {
            val authResult = firebaseAuth.signInWithCredential(credential).await()
            authResult.user
        }
    }

    /**
     * Transforms technical exceptions into friendly user-facing messages.
     */
    private fun mapAuthError(e: Exception, providerName: String): String {
        return when {
            e is GetCredentialCancellationException ||
            e.message?.contains("cancel", ignoreCase = true) == true ||
            e.message?.contains("User cancelled", ignoreCase = true) == true ->
                "Sign-in cancelled. You cancelled the sign-in process."

            e is NoCredentialException ||
            e.message?.contains("No credentials available", ignoreCase = true) == true ->
                "No credentials available on this device. Please sign into your account in device settings."

            e is FirebaseAuthUserCollisionException ->
                "An account already exists with this email address. Please sign in with your original provider."

            e is FirebaseNetworkException ||
            e.message?.contains("network", ignoreCase = true) == true ||
            e.message?.contains("timeout", ignoreCase = true) == true ->
                "No internet connection. Please check your internet connection and try again."

            e.message?.contains("DEVELOPER_ERROR", ignoreCase = true) == true ||
            e.message?.contains("10:", ignoreCase = true) == true ->
                "$providerName configuration issue. Please verify your SHA-1 fingerprint and OAuth Client ID."

            e.message?.contains("CONFIGURATION_NOT_FOUND", ignoreCase = true) == true ||
            e.message?.contains("provider is not enabled", ignoreCase = true) == true ->
                "$providerName is not yet enabled in your Firebase console."

            else ->
                "Sign-in failed. We couldn't sign you in. Please try again."
        }
    }

    /**
     * Sign out user cleanly from Firebase and reset local user preferences to guest.
     */
    suspend fun signOut() {
        auth?.signOut()
        settingsRepository.updateUserInfo(null, null, isGuest = false)
    }

    /**
     * Mark app state as Guest.
     */
    suspend fun setGuestMode() {
        settingsRepository.updateUserInfo(null, null, isGuest = true)
    }

    private val isSyncInProgress = java.util.concurrent.atomic.AtomicBoolean(false)

    /**
     * Synchronize local data to Firestore and pull remote updates using batch writes.
     */
    suspend fun syncWithFirebase(): Result<String> = withContext(Dispatchers.IO) {
        val user = auth?.currentUser
        val db = firestore
        if (user == null || db == null) {
            return@withContext Result.failure(Exception("Not signed in to a Firebase account"))
        }

        if (!isSyncInProgress.compareAndSet(false, true)) {
            return@withContext Result.success("Sync already in progress")
        }

        try {
            val userId = user.uid
            val userDoc = db.collection("users").document(userId)

            // 1. Sync Settings
            val settings = settingsRepository.getSettingsDirect()
            val settingsData = hashMapOf(
                "publisherStatus" to settings.publisherStatus.name,
                "customGoalHours" to settings.customGoalHours,
                "themeMode" to settings.themeMode,
                "updatedAt" to System.currentTimeMillis()
            )
            userDoc.collection("settings").document("profile").set(settingsData, SetOptions.merge()).await()

            // 2. Batch Upload local ministry entries (up to 450 per batch)
            val localEntries = ministryRepository.getAllList()
            val entriesCollection = userDoc.collection("ministryEntries")
            if (localEntries.isNotEmpty()) {
                val chunks = localEntries.chunked(450)
                for (chunk in chunks) {
                    val batch = db.batch()
                    for (entry in chunk) {
                        val entryData = hashMapOf(
                            "id" to entry.id,
                            "dateMillis" to entry.dateMillis,
                            "startTimeMillis" to entry.startTimeMillis,
                            "endTimeMillis" to entry.endTimeMillis,
                            "durationMinutes" to entry.durationMinutes,
                            "ministryType" to entry.ministryType.name,
                            "returnVisits" to entry.returnVisits,
                            "bibleStudies" to entry.bibleStudies,
                            "placements" to entry.placements,
                            "location" to entry.location,
                            "notes" to entry.notes,
                            "updatedAt" to entry.updatedAt
                        )
                        batch.set(entriesCollection.document(entry.id.toString()), entryData, SetOptions.merge())
                    }
                    batch.commit().await()
                }
            }

            // 3. Batch Upload local scheduled events
            val localEvents = scheduledEventRepository.getAllList()
            val eventsCollection = userDoc.collection("events")
            if (localEvents.isNotEmpty()) {
                val chunks = localEvents.chunked(450)
                for (chunk in chunks) {
                    val batch = db.batch()
                    for (event in chunk) {
                        val eventData = hashMapOf(
                            "id" to event.id,
                            "title" to event.title,
                            "dateMillis" to event.dateMillis,
                            "startTimeMillis" to event.startTimeMillis,
                            "endTimeMillis" to event.endTimeMillis,
                            "location" to event.location,
                            "description" to event.description,
                            "reminderMinutesBefore" to event.reminderMinutesBefore,
                            "repeatOption" to event.repeatOption.name,
                            "isCompleted" to event.isCompleted
                        )
                        batch.set(eventsCollection.document(event.id.toString()), eventData, SetOptions.merge())
                    }
                    batch.commit().await()
                }
            }

            // 4. Download remote ministry entries
            val remoteEntriesSnap = entriesCollection.get().await()
            val remoteEntries = ArrayList<MinistryEntry>(remoteEntriesSnap.size())
            for (doc in remoteEntriesSnap.documents) {
                val duration = doc.getLong("durationMinutes")?.toInt() ?: 0
                val dateMillis = doc.getLong("dateMillis") ?: System.currentTimeMillis()
                val typeStr = doc.getString("ministryType") ?: "HOUSE_TO_HOUSE"
                val returnVisits = doc.getLong("returnVisits")?.toInt() ?: 0
                val bibleStudies = doc.getLong("bibleStudies")?.toInt() ?: 0
                val placements = doc.getLong("placements")?.toInt() ?: 0
                val location = doc.getString("location") ?: ""
                val notes = doc.getString("notes") ?: ""
                val id = doc.getLong("id") ?: 0L

                remoteEntries.add(
                    MinistryEntry(
                        id = id,
                        dateMillis = dateMillis,
                        durationMinutes = duration,
                        ministryType = MinistryType.fromString(typeStr),
                        returnVisits = returnVisits,
                        bibleStudies = bibleStudies,
                        placements = placements,
                        location = location,
                        notes = notes,
                        isSynced = true
                    )
                )
            }
            if (remoteEntries.isNotEmpty()) {
                ministryRepository.restoreEntries(remoteEntries)
            }

            Result.success("Synced successfully with Cloud Firestore")
        } catch (e: Exception) {
            Log.e("FirebaseSync", "Sync error", e)
            Result.failure(e)
        } finally {
            isSyncInProgress.set(false)
        }
    }

    /**
     * Exports ministry entries as a CSV string.
     */
    suspend fun exportToCsv(): String = withContext(Dispatchers.IO) {
        val entries = ministryRepository.getAllList()
        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

        val sb = StringBuilder()
        sb.append("Date,Ministry Type,Duration (Hours:Mins),Minutes,Return Visits,Bible Studies,Placements,Location,Notes\n")

        for (entry in entries) {
            val dateStr = dateFormat.format(Date(entry.dateMillis))
            val hours = entry.durationMinutes / 60
            val mins = entry.durationMinutes % 60
            val timeStr = "${hours}h ${mins}m"
            val sanitizedNotes = entry.notes.replace("\"", "\"\"")
            val sanitizedLocation = entry.location.replace("\"", "\"\"")

            sb.append("\"$dateStr\",")
            sb.append("\"${entry.ministryType.displayName}\",")
            sb.append("\"$timeStr\",")
            sb.append("${entry.durationMinutes},")
            sb.append("${entry.returnVisits},")
            sb.append("${entry.bibleStudies},")
            sb.append("${entry.placements},")
            sb.append("\"$sanitizedLocation\",")
            sb.append("\"$sanitizedNotes\"\n")
        }
        sb.toString()
    }

    /**
     * Generates a clean structured text / PDF summary for monthly reports.
     */
    suspend fun generateReportSummary(year: Int, month: Int): String = withContext(Dispatchers.IO) {
        val cal = java.util.Calendar.getInstance().apply {
            set(java.util.Calendar.YEAR, year)
            set(java.util.Calendar.MONTH, month)
            set(java.util.Calendar.DAY_OF_MONTH, 1)
        }
        val monthName = SimpleDateFormat("MMMM yyyy", Locale.getDefault()).format(cal.time)
        val entries = ministryRepository.getAllList().filter {
            val c = java.util.Calendar.getInstance().apply { timeInMillis = it.dateMillis }
            c.get(java.util.Calendar.YEAR) == year && c.get(java.util.Calendar.MONTH) == month
        }

        val totalMinutes = entries.sumOf { it.durationMinutes }
        val totalHours = totalMinutes / 60
        val remainingMinutes = totalMinutes % 60
        val totalRV = entries.sumOf { it.returnVisits }
        val totalBS = entries.sumOf { it.bibleStudies }
        val totalPlacements = entries.sumOf { it.placements }
        val activeDays = entries.map {
            val c = java.util.Calendar.getInstance().apply { timeInMillis = it.dateMillis }
            c.get(java.util.Calendar.DAY_OF_MONTH)
        }.distinct().size

        val settings = settingsRepository.getSettingsDirect()

        """
========================================
   JEHOVAH'S WITNESSES MINISTRY REPORT
========================================
Month: $monthName
Publisher Status: ${settings.publisherStatus.displayName}

SUMMARY STATISTICS
----------------------------------------
Total Hours:      ${totalHours}h ${remainingMinutes}m (${String.format(Locale.getDefault(), "%.1f", totalMinutes / 60.0)} hrs)
Active Days:      $activeDays
Return Visits:    $totalRV
Bible Studies:    $totalBS
Placements:       $totalPlacements

ACTIVITY DETAILS
----------------------------------------
${entries.joinToString("\n") { entry ->
    val dateStr = SimpleDateFormat("MMM dd", Locale.getDefault()).format(Date(entry.dateMillis))
    val h = entry.durationMinutes / 60
    val m = entry.durationMinutes % 60
    "• $dateStr | ${h}h ${m}m | ${entry.ministryType.displayName} | RV: ${entry.returnVisits}, BS: ${entry.bibleStudies}, Placements: ${entry.placements}"
}}
========================================
Generated by JW Ministry Tracker
        """.trimIndent()
    }

    /**
     * Backup entire app data into JSON format.
     */
    suspend fun createBackupJson(): String = withContext(Dispatchers.IO) {
        val root = JSONObject()
        val entries = ministryRepository.getAllList()
        val events = scheduledEventRepository.getAllList()
        val settings = settingsRepository.getSettingsDirect()

        val entriesArray = JSONArray()
        for (e in entries) {
            val obj = JSONObject().apply {
                put("id", e.id)
                put("dateMillis", e.dateMillis)
                put("startTimeMillis", e.startTimeMillis)
                put("endTimeMillis", e.endTimeMillis)
                put("durationMinutes", e.durationMinutes)
                put("ministryType", e.ministryType.name)
                put("returnVisits", e.returnVisits)
                put("bibleStudies", e.bibleStudies)
                put("placements", e.placements)
                put("location", e.location)
                put("notes", e.notes)
            }
            entriesArray.put(obj)
        }

        val eventsArray = JSONArray()
        for (ev in events) {
            val obj = JSONObject().apply {
                put("id", ev.id)
                put("title", ev.title)
                put("dateMillis", ev.dateMillis)
                put("startTimeMillis", ev.startTimeMillis)
                put("endTimeMillis", ev.endTimeMillis)
                put("location", ev.location)
                put("description", ev.description)
                put("reminderMinutesBefore", ev.reminderMinutesBefore)
                put("repeatOption", ev.repeatOption.name)
                put("isCompleted", ev.isCompleted)
            }
            eventsArray.put(obj)
        }

        root.put("version", 1)
        root.put("backupDate", System.currentTimeMillis())
        root.put("publisherStatus", settings.publisherStatus.name)
        root.put("customGoalHours", settings.customGoalHours)
        root.put("ministryEntries", entriesArray)
        root.put("scheduledEvents", eventsArray)

        root.toString(2)
    }

    /**
     * Restore app data from JSON string.
     */
    suspend fun restoreFromJson(jsonStr: String): Result<Int> = withContext(Dispatchers.IO) {
        try {
            val root = JSONObject(jsonStr)
            val entriesArray = root.optJSONArray("ministryEntries") ?: JSONArray()
            val restoredEntries = mutableListOf<MinistryEntry>()

            for (i in 0 until entriesArray.length()) {
                val obj = entriesArray.getJSONObject(i)
                restoredEntries.add(
                    MinistryEntry(
                        id = obj.optLong("id", 0),
                        dateMillis = obj.optLong("dateMillis", System.currentTimeMillis()),
                        startTimeMillis = obj.optLong("startTimeMillis", 0),
                        endTimeMillis = obj.optLong("endTimeMillis", 0),
                        durationMinutes = obj.optInt("durationMinutes", 0),
                        ministryType = MinistryType.fromString(obj.optString("ministryType", "HOUSE_TO_HOUSE")),
                        returnVisits = obj.optInt("returnVisits", 0),
                        bibleStudies = obj.optInt("bibleStudies", 0),
                        placements = obj.optInt("placements", 0),
                        location = obj.optString("location", ""),
                        notes = obj.optString("notes", "")
                    )
                )
            }

            if (restoredEntries.isNotEmpty()) {
                ministryRepository.restoreEntries(restoredEntries)
            }

            val statusStr = root.optString("publisherStatus", "")
            if (statusStr.isNotEmpty()) {
                val status = PublisherStatus.fromString(statusStr)
                val goal = root.optInt("customGoalHours", status.defaultGoalHours)
                settingsRepository.updatePublisherStatus(status, goal)
            }

            Result.success(restoredEntries.size)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

