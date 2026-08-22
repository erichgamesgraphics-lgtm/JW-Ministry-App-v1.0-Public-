package com.example.data.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.data.model.TimerStateEntity
import com.example.data.model.UserSettings
import kotlinx.coroutines.flow.Flow

@Dao
interface UserSettingsDao {
    @Query("SELECT * FROM user_settings WHERE id = 1")
    fun getSettings(): Flow<UserSettings?>

    @Query("SELECT * FROM user_settings WHERE id = 1")
    suspend fun getSettingsDirect(): UserSettings?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(settings: UserSettings)
}

@Dao
interface TimerStateDao {
    @Query("SELECT * FROM timer_state WHERE id = 1")
    fun getTimerState(): Flow<TimerStateEntity?>

    @Query("SELECT * FROM timer_state WHERE id = 1")
    suspend fun getTimerStateDirect(): TimerStateEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveTimerState(state: TimerStateEntity)

    @Query("DELETE FROM timer_state")
    suspend fun clearTimerState()
}
