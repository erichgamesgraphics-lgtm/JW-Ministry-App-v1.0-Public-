package com.example

import android.app.Application
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.example.data.database.AppDatabase
import com.example.data.model.MinistryEntry
import com.example.data.model.MinistryType
import com.example.data.model.PublisherStatus
import com.example.data.model.ScheduledEvent
import com.example.data.model.UserSettings
import com.example.data.repository.MinistryRepository
import com.example.data.repository.ScheduledEventRepository
import com.example.data.repository.SettingsRepository
import com.example.data.repository.TimerRepository
import com.example.ui.viewmodel.MinistryViewModel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.util.Calendar

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class MinistryTrackerRobolectricTest {

    private lateinit var db: AppDatabase
    private lateinit var ministryRepo: MinistryRepository
    private lateinit var settingsRepo: SettingsRepository
    private lateinit var scheduleRepo: ScheduledEventRepository
    private lateinit var timerRepo: TimerRepository
    private val testScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    @Before
    fun createDb() {
        val context = ApplicationProvider.getApplicationContext<Application>()
        db = Room.inMemoryDatabaseBuilder(context, AppDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        ministryRepo = MinistryRepository(db.ministryEntryDao())
        settingsRepo = SettingsRepository(db.userSettingsDao())
        scheduleRepo = ScheduledEventRepository(db.scheduledEventDao())
        timerRepo = TimerRepository(db.timerStateDao(), testScope)
    }

    @After
    fun closeDb() {
        db.close()
    }

    @Test
    fun testEntryCrudOperations() = runBlocking {
        // 1. Create entry
        val entry = MinistryEntry(
            id = 101L,
            dateMillis = System.currentTimeMillis(),
            startTimeMillis = System.currentTimeMillis(),
            endTimeMillis = System.currentTimeMillis() + 5400000L,
            durationMinutes = 90,
            placements = 2,
            returnVisits = 3,
            bibleStudies = 1,
            notes = "Inspiring conversation with John about Psalms",
            location = "North District",
            ministryType = MinistryType.HOUSE_TO_HOUSE
        )
        ministryRepo.insert(entry)

        // 2. Read entry
        val loaded = ministryRepo.getEntryById(101L)
        assertNotNull(loaded)
        assertEquals(90, loaded?.durationMinutes)
        assertEquals(2, loaded?.placements)
        assertEquals(3, loaded?.returnVisits)

        // 3. Update entry
        val updated = loaded!!.copy(durationMinutes = 120, placements = 4)
        ministryRepo.update(updated)

        val reloaded = ministryRepo.getEntryById(101L)
        assertEquals(120, reloaded?.durationMinutes)
        assertEquals(4, reloaded?.placements)

        // 4. Delete entry
        ministryRepo.delete(reloaded!!)
        val afterDelete = ministryRepo.getEntryById(101L)
        assertEquals(null, afterDelete)
    }

    @Test
    fun testTimerLifecycle() = runBlocking {
        // Start timer
        timerRepo.startTimer()
        var state = timerRepo.timerEntity.value
        assertTrue(state.isRunning)
        assertFalse(state.isPaused)

        // Pause timer
        timerRepo.pauseTimer()
        state = timerRepo.timerEntity.value
        assertTrue(state.isPaused)

        // Resume timer
        timerRepo.resumeTimer()
        state = timerRepo.timerEntity.value
        assertFalse(state.isPaused)

        // Stop timer
        val duration = timerRepo.stopTimer()
        state = timerRepo.timerEntity.value
        assertFalse(state.isRunning)
    }

    @Test
    fun testSettingsPersistence() = runBlocking {
        // Update user status and theme
        settingsRepo.updatePublisherStatus(PublisherStatus.REGULAR_PIONEER_50, customGoal = 50)
        settingsRepo.updateTheme("DARK")
        settingsRepo.updateUserInfo(email = "publisher@example.com", name = "Brother Alex", isGuest = false)

        val settings = settingsRepo.getSettingsDirect()
        assertEquals(PublisherStatus.REGULAR_PIONEER_50, settings.publisherStatus)
        assertEquals(50, settings.customGoalHours)
        assertEquals("DARK", settings.themeMode)
        assertEquals("publisher@example.com", settings.userEmail)
        assertEquals("Brother Alex", settings.userName)
        assertFalse(settings.isGuest)

        // Switch to guest mode
        settingsRepo.updateUserInfo(email = null, name = null, isGuest = true)
        val guestSettings = settingsRepo.getSettingsDirect()
        assertTrue(guestSettings.isGuest)
    }

    @Test
    fun testScheduledEventsCrud() = runBlocking {
        val event = ScheduledEvent(
            id = 1L,
            title = "Morning Territory Ministry",
            dateMillis = System.currentTimeMillis() + 86400000L,
            startTimeMillis = System.currentTimeMillis() + 86400000L,
            endTimeMillis = System.currentTimeMillis() + 90000000L,
            location = "Town Square Cart #2",
            reminderMinutesBefore = 30
        )
        scheduleRepo.insert(event)

        val events = scheduleRepo.allEvents.first()
        assertEquals(1, events.size)
        assertEquals("Morning Territory Ministry", events[0].title)

        scheduleRepo.delete(events[0])
        val afterDelete = scheduleRepo.allEvents.first()
        assertEquals(0, afterDelete.size)
    }

    @Test
    fun testReportsAggregationCalculations() {
        val context = ApplicationProvider.getApplicationContext<Application>()
        val vm = MinistryViewModel(context)

        val cal = Calendar.getInstance()
        val now = cal.timeInMillis

        val sampleEntries = listOf(
            MinistryEntry(
                id = 1L,
                dateMillis = now,
                durationMinutes = 60,
                placements = 2,
                returnVisits = 1,
                bibleStudies = 1,
                notes = "Test 1"
            ),
            MinistryEntry(
                id = 2L,
                dateMillis = now,
                durationMinutes = 120,
                placements = 3,
                returnVisits = 2,
                bibleStudies = 0,
                notes = "Test 2"
            )
        )

        val report = vm.getReportsForPeriod(0, sampleEntries)
        assertEquals(180, report.totalMinutes)
        assertEquals(5, report.totalPlacements)
        assertEquals(3, report.totalReturnVisits)
        assertEquals(1, report.totalBibleStudies)
        assertEquals(1, report.activeDays)
    }
}
