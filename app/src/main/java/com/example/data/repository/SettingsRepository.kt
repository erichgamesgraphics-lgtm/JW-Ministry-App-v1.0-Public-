package com.example.data.repository

import com.example.data.database.UserSettingsDao
import com.example.data.model.PublisherStatus
import com.example.data.model.UserSettings
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class SettingsRepository(private val dao: UserSettingsDao) {

    val settings: Flow<UserSettings> = dao.getSettings().map {
        it ?: UserSettings()
    }

    suspend fun getSettingsDirect(): UserSettings {
        return dao.getSettingsDirect() ?: UserSettings()
    }

    suspend fun updateSettings(settings: UserSettings) {
        dao.insertOrUpdate(settings)
    }

    suspend fun updatePublisherStatus(status: PublisherStatus, customGoal: Int = 0) {
        val current = getSettingsDirect()
        val goal = if (customGoal > 0) customGoal else status.defaultGoalHours
        dao.insertOrUpdate(current.copy(publisherStatus = status, customGoalHours = goal))
    }

    suspend fun updateTheme(themeMode: String) {
        val current = getSettingsDirect()
        dao.insertOrUpdate(current.copy(themeMode = themeMode))
    }

    suspend fun updateNotifications(enabled: Boolean, dailyReminder: Boolean = false, dailyHour: Int = 8, dailyMinute: Int = 0) {
        val current = getSettingsDirect()
        dao.insertOrUpdate(current.copy(
            notificationsEnabled = enabled,
            dailyReminderEnabled = dailyReminder,
            dailyReminderHour = dailyHour,
            dailyReminderMinute = dailyMinute
        ))
    }

    suspend fun updateUserInfo(email: String?, name: String?, isGuest: Boolean) {
        val current = getSettingsDirect()
        dao.insertOrUpdate(current.copy(userEmail = email, userName = name, isGuest = isGuest))
    }
}
