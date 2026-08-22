package com.example.data.repository

import com.example.data.database.ScheduledEventDao
import com.example.data.model.ScheduledEvent
import kotlinx.coroutines.flow.Flow
import java.util.Calendar

class ScheduledEventRepository(private val dao: ScheduledEventDao) {

    val allEvents: Flow<List<ScheduledEvent>> = dao.getAllEvents()

    suspend fun getEventById(id: Long): ScheduledEvent? = dao.getEventById(id)

    suspend fun insert(event: ScheduledEvent): Long = dao.insertEvent(event)

    suspend fun update(event: ScheduledEvent) = dao.updateEvent(event)

    suspend fun delete(event: ScheduledEvent) = dao.deleteEvent(event)

    suspend fun deleteById(id: Long) = dao.deleteEventById(id)

    suspend fun getAllList(): List<ScheduledEvent> = dao.getAllEventsList()

    suspend fun restoreEvents(events: List<ScheduledEvent>) = dao.insertAll(events)

    fun getEventsForDay(dateMillis: Long): Flow<List<ScheduledEvent>> {
        val cal = Calendar.getInstance().apply {
            timeInMillis = dateMillis
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val start = cal.timeInMillis
        cal.add(Calendar.DAY_OF_YEAR, 1)
        val end = cal.timeInMillis
        return dao.getEventsBetweenDates(start, end - 1)
    }

    fun getEventsForMonth(year: Int, month: Int): Flow<List<ScheduledEvent>> {
        val cal = Calendar.getInstance().apply {
            set(Calendar.YEAR, year)
            set(Calendar.MONTH, month)
            set(Calendar.DAY_OF_MONTH, 1)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val start = cal.timeInMillis
        cal.add(Calendar.MONTH, 1)
        val end = cal.timeInMillis
        return dao.getEventsBetweenDates(start, end - 1)
    }
}
