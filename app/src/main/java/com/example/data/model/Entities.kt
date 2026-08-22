package com.example.data.model

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "ministry_entries",
    indices = [
        Index(value = ["dateMillis"]),
        Index(value = ["isSynced"])
    ]
)
data class MinistryEntry(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val dateMillis: Long, // Start of day timestamp or exact date
    val startTimeMillis: Long = 0,
    val endTimeMillis: Long = 0,
    val durationMinutes: Int,
    val ministryType: MinistryType = MinistryType.HOUSE_TO_HOUSE,
    val returnVisits: Int = 0,
    val bibleStudies: Int = 0,
    val placements: Int = 0,
    val location: String = "",
    val notes: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val isSynced: Boolean = false
)

@Entity(
    tableName = "scheduled_events",
    indices = [
        Index(value = ["dateMillis"])
    ]
)
data class ScheduledEvent(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val title: String,
    val dateMillis: Long,
    val startTimeMillis: Long,
    val endTimeMillis: Long,
    val location: String = "",
    val description: String = "",
    val reminderMinutesBefore: Int = 15,
    val repeatOption: RepeatOption = RepeatOption.NONE,
    val isCompleted: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val isSynced: Boolean = false
)

@Entity(tableName = "user_settings")
data class UserSettings(
    @PrimaryKey
    val id: Int = 1, // Single record
    val publisherStatus: PublisherStatus = PublisherStatus.PUBLISHER,
    val customGoalHours: Int = 0, // 0 means default of status
    val themeMode: String = "SYSTEM", // "SYSTEM", "LIGHT", "DARK"
    val notificationsEnabled: Boolean = true,
    val dailyReminderEnabled: Boolean = false,
    val dailyReminderHour: Int = 8,
    val dailyReminderMinute: Int = 0,
    val monthlyReportReminderEnabled: Boolean = true,
    val backupLastDateMillis: Long = 0,
    val userEmail: String? = null,
    val userName: String? = null,
    val isGuest: Boolean = true
)

@Entity(tableName = "timer_state")
data class TimerStateEntity(
    @PrimaryKey
    val id: Int = 1,
    val isRunning: Boolean = false,
    val isPaused: Boolean = false,
    val startTimestampMillis: Long = 0,
    val accumulatedDurationSeconds: Long = 0,
    val pausedTimestampMillis: Long = 0
)

data class DailyScripture(
    val dayOfYear: Int,
    val reference: String,
    val text: String,
    val theme: String = ""
)
