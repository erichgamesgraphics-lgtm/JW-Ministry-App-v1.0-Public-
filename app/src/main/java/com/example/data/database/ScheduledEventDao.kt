package com.example.data.database

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.data.model.ScheduledEvent
import kotlinx.coroutines.flow.Flow

@Dao
interface ScheduledEventDao {
    @Query("SELECT * FROM scheduled_events ORDER BY dateMillis ASC, startTimeMillis ASC")
    fun getAllEvents(): Flow<List<ScheduledEvent>>

    @Query("SELECT * FROM scheduled_events WHERE dateMillis >= :startOfDayMillis AND dateMillis < :endOfDayMillis ORDER BY startTimeMillis ASC")
    fun getEventsForDay(startOfDayMillis: Long, endOfDayMillis: Long): Flow<List<ScheduledEvent>>

    @Query("SELECT * FROM scheduled_events WHERE dateMillis >= :startMillis AND dateMillis <= :endMillis ORDER BY dateMillis ASC")
    fun getEventsBetweenDates(startMillis: Long, endMillis: Long): Flow<List<ScheduledEvent>>

    @Query("SELECT * FROM scheduled_events WHERE id = :id")
    suspend fun getEventById(id: Long): ScheduledEvent?

    @Query("SELECT * FROM scheduled_events ORDER BY dateMillis ASC")
    suspend fun getAllEventsList(): List<ScheduledEvent>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvent(event: ScheduledEvent): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(events: List<ScheduledEvent>)

    @Update
    suspend fun updateEvent(event: ScheduledEvent)

    @Delete
    suspend fun deleteEvent(event: ScheduledEvent)

    @Query("DELETE FROM scheduled_events WHERE id = :id")
    suspend fun deleteEventById(id: Long)

    @Query("DELETE FROM scheduled_events")
    suspend fun deleteAll()
}
