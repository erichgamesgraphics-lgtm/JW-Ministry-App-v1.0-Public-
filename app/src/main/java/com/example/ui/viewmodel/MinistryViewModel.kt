package com.example.ui.viewmodel

import android.app.Activity
import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.MinistryApp
import com.example.data.model.DailyScripture
import com.example.data.model.MinistryEntry
import com.example.data.model.MinistryType
import com.example.data.model.PublisherStatus
import com.example.data.model.RepeatOption
import com.example.data.model.ScheduledEvent
import com.example.data.model.TimerStateEntity
import com.example.data.model.UserSettings
import com.example.notifications.NotificationHelper
import com.google.firebase.auth.FirebaseUser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.Calendar

data class DashboardStats(
    val todayMinutes: Int = 0,
    val monthMinutes: Int = 0,
    val yearMinutes: Int = 0,
    val todayReturnVisits: Int = 0,
    val todayBibleStudies: Int = 0,
    val todayPlacements: Int = 0,
    val monthReturnVisits: Int = 0,
    val monthBibleStudies: Int = 0,
    val monthPlacements: Int = 0,
    val streakMonths: Int = 0,
    val goalHours: Int = 0,
    val goalProgressPercentage: Float = 0f,
    val remainingGoalMinutes: Int = 0
)

data class ReportsData(
    val totalMinutes: Int = 0,
    val activeDays: Int = 0,
    val totalReturnVisits: Int = 0,
    val totalBibleStudies: Int = 0,
    val totalPlacements: Int = 0,
    val streakMonths: Int = 0,
    val monthlyHoursBreakdown: List<Pair<String, Float>> = emptyList(), // e.g. "Aug" to 14.5f
    val weeklyHoursBreakdown: List<Pair<String, Float>> = emptyList()  // e.g. "W1" to 5.0f
)

class MinistryViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as MinistryApp
    private val ministryRepo = app.ministryRepository
    private val scheduleRepo = app.scheduledEventRepository
    private val settingsRepo = app.settingsRepository
    private val scriptureRepo = app.scriptureRepository
    private val timerRepo = app.timerRepository
    val authAndSyncRepo = app.authAndSyncRepository

    // Search query
    val searchQuery = MutableStateFlow("")

    // Current Firebase Auth user state
    val currentUser: StateFlow<FirebaseUser?> = authAndSyncRepo.authStateFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, authAndSyncRepo.currentUser)

    // Authentication progress indicator
    val isAuthenticating = MutableStateFlow(false)

    // Entries and search results
    val allEntries: StateFlow<List<MinistryEntry>> = combine(
        ministryRepo.allEntries,
        searchQuery
    ) { entries, query ->
        if (query.isBlank()) {
            entries
        } else {
            val q = query.trim().lowercase()
            entries.filter {
                it.notes.lowercase().contains(q) ||
                it.location.lowercase().contains(q) ||
                it.ministryType.displayName.lowercase().contains(q)
            }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val scheduledEvents: StateFlow<List<ScheduledEvent>> = scheduleRepo.allEvents
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val userSettings: StateFlow<UserSettings> = settingsRepo.settings
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UserSettings())

    val dailyScripture = MutableStateFlow(scriptureRepo.getScriptureForDate())

    // Calendar state
    val selectedCalendarDate = MutableStateFlow(Calendar.getInstance().timeInMillis)
    val calendarMonthOffset = MutableStateFlow(0) // 0 is current month

    // Timer Live State
    val timerEntity: StateFlow<TimerStateEntity> = timerRepo.timerEntity
    val currentTimerSeconds = MutableStateFlow(0L)

    // UI Feedback Message Channel
    private val _userMessage = MutableSharedFlow<String>()
    val userMessage = _userMessage.asSharedFlow()

    // Sync / Loading state
    val isSyncing = MutableStateFlow(false)

    // Startup initial auth check state (prevents Welcome screen flicker)
    val isCheckingAuthState = MutableStateFlow(true)

    private var timerJob: Job? = null

    init {
        // Resolve initial auth and local settings state
        viewModelScope.launch(Dispatchers.IO) {
            try {
                // Ensure room settings are loaded from disk
                settingsRepo.getSettingsDirect()
            } catch (e: Exception) {
                // Graceful fallback
            }
            isCheckingAuthState.value = false
        }

        // Optimized ticker: active once per second only when timer is running and unpaused
        viewModelScope.launch {
            timerRepo.timerEntity.collectLatest { state ->
                timerJob?.cancel()
                currentTimerSeconds.value = timerRepo.calculateCurrentDurationSeconds()
                if (state.isRunning && !state.isPaused) {
                    timerJob = viewModelScope.launch(Dispatchers.Default) {
                        while (true) {
                            currentTimerSeconds.value = timerRepo.calculateCurrentDurationSeconds()
                            delay(1000)
                        }
                    }
                }
            }
        }
    }

    /**
     * Check if user is signed in with Firebase or has elected guest access.
     */
    fun isUserAuthenticatedOrGuest(): Boolean {
        return authAndSyncRepo.isUserSignedIn() || userSettings.value.isGuest
    }

    /**
     * Perform real Google Sign-In flow.
     */
    fun signInWithGoogle(activity: Activity, onSuccess: () -> Unit, onError: (String) -> Unit) {
        if (isAuthenticating.value) return
        viewModelScope.launch {
            isAuthenticating.value = true
            val result = authAndSyncRepo.signInWithGoogle(activity)
            isAuthenticating.value = false
            result.onSuccess { user ->
                val name = user.displayName ?: user.email ?: "Publisher"
                _userMessage.emit("Welcome back, $name!")
                onSuccess()
            }.onFailure { err ->
                val msg = err.localizedMessage ?: "Google Sign-In failed"
                _userMessage.emit(msg)
                onError(msg)
            }
        }
    }

    /**
     * Perform real Sign in with Apple flow.
     */
    fun signInWithApple(activity: Activity, onSuccess: () -> Unit, onError: (String) -> Unit) {
        if (isAuthenticating.value) return
        viewModelScope.launch {
            isAuthenticating.value = true
            val result = authAndSyncRepo.signInWithApple(activity)
            isAuthenticating.value = false
            result.onSuccess { user ->
                val name = user.displayName ?: user.email ?: "Publisher"
                _userMessage.emit("Welcome back, $name!")
                onSuccess()
            }.onFailure { err ->
                val msg = err.localizedMessage ?: "Apple Sign-In failed"
                _userMessage.emit(msg)
                onError(msg)
            }
        }
    }

    /**
     * User chooses guest mode without linking an account.
     */
    fun continueAsGuest(onSuccess: () -> Unit) {
        viewModelScope.launch {
            authAndSyncRepo.setGuestMode()
            onSuccess()
        }
    }

    fun getWebClientId(): String {
        return authAndSyncRepo.getWebClientId()
    }

    fun saveCustomWebClientId(clientId: String) {
        authAndSyncRepo.saveCustomWebClientId(clientId)
        viewModelScope.launch {
            _userMessage.emit(if (clientId.isNotBlank()) "Google Web Client ID updated" else "Web Client ID cleared")
        }
    }


    // Dynamic stats computation with fast single-pass aggregation
    val dashboardStats: StateFlow<DashboardStats> = combine(
        ministryRepo.allEntries,
        userSettings
    ) { entries, settings ->
        val now = Calendar.getInstance()
        val currentYear = now.get(Calendar.YEAR)
        val currentMonth = now.get(Calendar.MONTH)
        val currentDay = now.get(Calendar.DAY_OF_YEAR)

        var todayMin = 0
        var monthMin = 0
        var yearMin = 0
        var todayRV = 0
        var todayBS = 0
        var todayPl = 0
        var monthRV = 0
        var monthBS = 0
        var monthPl = 0

        val cal = Calendar.getInstance()
        for (i in entries.indices) {
            val entry = entries[i]
            cal.timeInMillis = entry.dateMillis
            val eYear = cal.get(Calendar.YEAR)
            if (eYear == currentYear) {
                yearMin += entry.durationMinutes
                val eMonth = cal.get(Calendar.MONTH)
                if (eMonth == currentMonth) {
                    monthMin += entry.durationMinutes
                    monthRV += entry.returnVisits
                    monthBS += entry.bibleStudies
                    monthPl += entry.placements

                    val eDay = cal.get(Calendar.DAY_OF_YEAR)
                    if (eDay == currentDay) {
                        todayMin += entry.durationMinutes
                        todayRV += entry.returnVisits
                        todayBS += entry.bibleStudies
                        todayPl += entry.placements
                    }
                }
            }
        }

        val streak = ministryRepo.calculateStreak(entries)
        val goalHours = if (settings.customGoalHours > 0) settings.customGoalHours else settings.publisherStatus.defaultGoalHours
        val goalMinutes = goalHours * 60

        val progress = if (goalMinutes > 0) {
            (monthMin.toFloat() / goalMinutes.toFloat()).coerceIn(0f, 1f)
        } else {
            1f
        }
        val remaining = maxOf(0, goalMinutes - monthMin)

        DashboardStats(
            todayMinutes = todayMin,
            monthMinutes = monthMin,
            yearMinutes = yearMin,
            todayReturnVisits = todayRV,
            todayBibleStudies = todayBS,
            todayPlacements = todayPl,
            monthReturnVisits = monthRV,
            monthBibleStudies = monthBS,
            monthPlacements = monthPl,
            streakMonths = streak,
            goalHours = goalHours,
            goalProgressPercentage = progress,
            remainingGoalMinutes = remaining
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), DashboardStats())

    // Timer actions
    fun startTimer() {
        viewModelScope.launch {
            timerRepo.startTimer()
        }
    }

    fun pauseTimer() {
        viewModelScope.launch {
            timerRepo.pauseTimer()
        }
    }

    fun resumeTimer() {
        viewModelScope.launch {
            timerRepo.resumeTimer()
        }
    }

    fun stopTimer(onStopped: (durationMinutes: Int) -> Unit) {
        viewModelScope.launch {
            val seconds = timerRepo.stopTimer()
            val minutes = maxOf(1, ((seconds + 30) / 60).toInt()) // round to nearest minute, minimum 1
            onStopped(minutes)
        }
    }

    fun cancelTimer() {
        viewModelScope.launch {
            timerRepo.resetTimer()
        }
    }

    // Ministry Entry Operations
    fun saveMinistryEntry(
        id: Long = 0,
        dateMillis: Long,
        startTimeMillis: Long,
        endTimeMillis: Long,
        durationMinutes: Int,
        ministryType: MinistryType,
        returnVisits: Int,
        bibleStudies: Int,
        placements: Int,
        location: String,
        notes: String
    ) {
        viewModelScope.launch(Dispatchers.IO) {
            val entry = MinistryEntry(
                id = id,
                dateMillis = dateMillis,
                startTimeMillis = startTimeMillis,
                endTimeMillis = endTimeMillis,
                durationMinutes = maxOf(0, durationMinutes),
                ministryType = ministryType,
                returnVisits = maxOf(0, returnVisits),
                bibleStudies = maxOf(0, bibleStudies),
                placements = maxOf(0, placements),
                location = location.trim(),
                notes = notes.trim(),
                updatedAt = System.currentTimeMillis()
            )
            if (id == 0L) {
                ministryRepo.insert(entry)
                _userMessage.emit("Ministry entry saved successfully")
            } else {
                ministryRepo.update(entry)
                _userMessage.emit("Ministry entry updated successfully")
            }
        }
    }

    fun deleteMinistryEntry(entry: MinistryEntry) {
        viewModelScope.launch(Dispatchers.IO) {
            ministryRepo.delete(entry)
            _userMessage.emit("Ministry entry deleted")
        }
    }

    // Scheduled Event Operations
    fun saveScheduledEvent(
        id: Long = 0,
        title: String,
        dateMillis: Long,
        startTimeMillis: Long,
        endTimeMillis: Long,
        location: String,
        description: String,
        reminderMinutesBefore: Int,
        repeatOption: RepeatOption
    ) {
        viewModelScope.launch(Dispatchers.IO) {
            val event = ScheduledEvent(
                id = id,
                title = title.ifBlank { "Ministry" }.trim(),
                dateMillis = dateMillis,
                startTimeMillis = startTimeMillis,
                endTimeMillis = endTimeMillis,
                location = location.trim(),
                description = description.trim(),
                reminderMinutesBefore = reminderMinutesBefore,
                repeatOption = repeatOption
            )
            val eventId = if (id == 0L) {
                scheduleRepo.insert(event)
            } else {
                scheduleRepo.update(event)
                id
            }

            // Schedule notification alarm
            if (userSettings.value.notificationsEnabled && reminderMinutesBefore >= 0) {
                NotificationHelper.scheduleEventReminder(
                    getApplication(),
                    eventId,
                    event.title,
                    startTimeMillis,
                    reminderMinutesBefore,
                    event.location
                )
            }
            _userMessage.emit("Ministry schedule saved")
        }
    }

    fun deleteScheduledEvent(event: ScheduledEvent) {
        viewModelScope.launch(Dispatchers.IO) {
            NotificationHelper.cancelEventReminder(getApplication(), event.id)
            scheduleRepo.delete(event)
            _userMessage.emit("Scheduled ministry removed")
        }
    }

    // Settings Operations
    fun updatePublisherStatus(status: PublisherStatus, customGoal: Int = 0) {
        viewModelScope.launch {
            settingsRepo.updatePublisherStatus(status, customGoal)
            _userMessage.emit("Publisher status updated to ${status.displayName}")
        }
    }

    fun updateTheme(themeMode: String) {
        viewModelScope.launch {
            settingsRepo.updateTheme(themeMode)
        }
    }

    fun updateNotifications(enabled: Boolean, dailyReminder: Boolean = false, dailyHour: Int = 8, dailyMinute: Int = 0) {
        viewModelScope.launch {
            settingsRepo.updateNotifications(enabled, dailyReminder, dailyHour, dailyMinute)
            _userMessage.emit(if (enabled) "Notifications enabled" else "Notifications disabled")
        }
    }

    // Sync with Firebase
    fun syncWithFirebase() {
        viewModelScope.launch {
            isSyncing.value = true
            val result = authAndSyncRepo.syncWithFirebase()
            isSyncing.value = false
            result.onSuccess { msg ->
                _userMessage.emit(msg)
            }.onFailure { err ->
                _userMessage.emit("Sync notice: ${err.localizedMessage ?: "Offline mode active"}")
            }
        }
    }

    // Backup & Restore
    fun createBackup(onBackupReady: (jsonString: String) -> Unit) {
        viewModelScope.launch {
            val json = authAndSyncRepo.createBackupJson()
            onBackupReady(json)
            _userMessage.emit("Backup file generated")
        }
    }

    fun restoreBackup(jsonString: String) {
        viewModelScope.launch {
            val result = authAndSyncRepo.restoreFromJson(jsonString)
            result.onSuccess { count ->
                _userMessage.emit("Restored $count ministry records successfully")
            }.onFailure {
                _userMessage.emit("Could not restore backup: Invalid backup format")
            }
        }
    }

    fun signOut(onSignedOut: () -> Unit) {
        viewModelScope.launch {
            authAndSyncRepo.signOut()
            _userMessage.emit("Signed out")
            onSignedOut()
        }
    }

    fun getReportsForPeriod(tabIndex: Int, entries: List<MinistryEntry>): ReportsData {
        // tabIndex: 0 = Month, 1 = Year, 2 = All Time
        val cal = Calendar.getInstance()
        val currentYear = cal.get(Calendar.YEAR)
        val currentMonth = cal.get(Calendar.MONTH)
        val currentYearMonth = currentYear * 12 + currentMonth

        var totalMin = 0
        var totalRV = 0
        var totalBS = 0
        var totalPl = 0
        val activeDaysSet = HashSet<Int>()

        // 6-month breakdown buckets (0 = 5 months ago, ..., 5 = current month)
        val monthlyMins = IntArray(6)
        val monthLabels = Array(6) { "" }
        val monthNames = arrayOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
        val bucketCal = Calendar.getInstance()
        for (i in 0..5) {
            bucketCal.timeInMillis = cal.timeInMillis
            bucketCal.add(Calendar.MONTH, -(5 - i))
            monthLabels[i] = monthNames[bucketCal.get(Calendar.MONTH)]
        }

        // Weekly breakdown buckets for current month (4 weeks: W1, W2, W3, W4)
        val weeklyMins = IntArray(4)

        for (i in entries.indices) {
            val entry = entries[i]
            cal.timeInMillis = entry.dateMillis
            val eYear = cal.get(Calendar.YEAR)
            val eMonth = cal.get(Calendar.MONTH)
            val eDayOfMonth = cal.get(Calendar.DAY_OF_MONTH)
            val eDayOfYear = cal.get(Calendar.DAY_OF_YEAR)
            val eYearMonth = eYear * 12 + eMonth

            // Check if matches selected period tab
            val matchesPeriod = when (tabIndex) {
                0 -> eYear == currentYear && eMonth == currentMonth
                1 -> eYear == currentYear
                else -> true
            }

            if (matchesPeriod) {
                totalMin += entry.durationMinutes
                totalRV += entry.returnVisits
                totalBS += entry.bibleStudies
                totalPl += entry.placements
                // Unique day hash without string allocation: year * 1000 + dayOfYear
                activeDaysSet.add(eYear * 1000 + eDayOfYear)

                // If in current month, calculate weekly bucket
                if (eYear == currentYear && eMonth == currentMonth) {
                    val weekIndex = when {
                        eDayOfMonth <= 7 -> 0
                        eDayOfMonth <= 14 -> 1
                        eDayOfMonth <= 21 -> 2
                        else -> 3
                    }
                    weeklyMins[weekIndex] += entry.durationMinutes
                }
            }

            // Monthly breakdown (last 6 months)
            val monthDiff = currentYearMonth - eYearMonth
            if (monthDiff in 0..5) {
                val bucketIndex = 5 - monthDiff
                monthlyMins[bucketIndex] += entry.durationMinutes
            }
        }

        val streak = ministryRepo.calculateStreak(entries)

        val monthlyBreakdown = ArrayList<Pair<String, Float>>(6)
        for (i in 0..5) {
            monthlyBreakdown.add(monthLabels[i] to (monthlyMins[i] / 60f))
        }

        val weeklyBreakdown = ArrayList<Pair<String, Float>>(4)
        for (w in 0..3) {
            weeklyBreakdown.add("W${w + 1}" to (weeklyMins[w] / 60f))
        }

        return ReportsData(
            totalMinutes = totalMin,
            activeDays = activeDaysSet.size,
            totalReturnVisits = totalRV,
            totalBibleStudies = totalBS,
            totalPlacements = totalPl,
            streakMonths = streak,
            monthlyHoursBreakdown = monthlyBreakdown,
            weeklyHoursBreakdown = weeklyBreakdown
        )
    }
}
