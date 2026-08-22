package com.example

import android.app.Application
import com.example.data.database.AppDatabase
import com.example.data.repository.AuthAndSyncRepository
import com.example.data.repository.MinistryRepository
import com.example.data.repository.ScheduledEventRepository
import com.example.data.repository.ScriptureRepository
import com.example.data.repository.SettingsRepository
import com.example.data.repository.TimerRepository
import com.example.notifications.NotificationHelper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

class MinistryApp : Application() {
    val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    val database by lazy { AppDatabase.getDatabase(this) }
    val ministryRepository by lazy { MinistryRepository(database.ministryEntryDao()) }
    val scheduledEventRepository by lazy { ScheduledEventRepository(database.scheduledEventDao()) }
    val settingsRepository by lazy { SettingsRepository(database.userSettingsDao()) }
    val scriptureRepository by lazy { ScriptureRepository() }
    val timerRepository by lazy { TimerRepository(database.timerStateDao(), applicationScope) }
    val authAndSyncRepository by lazy {
        AuthAndSyncRepository(this, ministryRepository, scheduledEventRepository, settingsRepository)
    }

    override fun onCreate() {
        super.onCreate()
        NotificationHelper.createNotificationChannels(this)
        try {
            if (com.google.firebase.FirebaseApp.getApps(this).isEmpty()) {
                try {
                    com.google.firebase.FirebaseApp.initializeApp(this)
                } catch (e: Exception) {
                    val options = com.google.firebase.FirebaseOptions.Builder()
                        .setApplicationId("1:481143643003:android:be9351059f674ed3")
                        .setApiKey("AIzaSyB-PlaceholderApiKeyForMinistryTracker")
                        .setProjectId("ministry-tracker-app")
                        .setDatabaseUrl("https://ministry-tracker-app.firebaseio.com")
                        .setStorageBucket("ministry-tracker-app.appspot.com")
                        .build()
                    com.google.firebase.FirebaseApp.initializeApp(this, options)
                }
            }
        } catch (e: Exception) {
            android.util.Log.w("MinistryApp", "Firebase auto-init: ${e.message}")
        }
    }
}
