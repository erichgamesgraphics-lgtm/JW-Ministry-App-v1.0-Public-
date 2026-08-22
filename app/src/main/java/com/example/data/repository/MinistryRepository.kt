package com.example.data.repository

import com.example.data.database.MinistryEntryDao
import com.example.data.model.MinistryEntry
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.Calendar

class MinistryRepository(private val dao: MinistryEntryDao) {

    val allEntries: Flow<List<MinistryEntry>> = dao.getAllEntries()

    fun search(query: String): Flow<List<MinistryEntry>> {
        return if (query.isBlank()) {
            allEntries
        } else {
            dao.searchEntries(query.trim())
        }
    }

    suspend fun getEntryById(id: Long): MinistryEntry? = dao.getEntryById(id)

    suspend fun insert(entry: MinistryEntry): Long = dao.insertEntry(entry)

    suspend fun update(entry: MinistryEntry) = dao.updateEntry(entry.copy(updatedAt = System.currentTimeMillis()))

    suspend fun delete(entry: MinistryEntry) = dao.deleteEntry(entry)

    suspend fun deleteById(id: Long) = dao.deleteEntryById(id)

    suspend fun getAllList(): List<MinistryEntry> = dao.getAllEntriesList()

    suspend fun restoreEntries(entries: List<MinistryEntry>) = dao.insertAll(entries)

    fun getEntriesForDay(dateMillis: Long): Flow<List<MinistryEntry>> {
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
        return dao.getEntriesBetweenDates(start, end - 1)
    }

    fun getEntriesForMonth(year: Int, month: Int): Flow<List<MinistryEntry>> {
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
        return dao.getEntriesBetweenDates(start, end - 1)
    }

    fun getEntriesForYear(year: Int): Flow<List<MinistryEntry>> {
        val cal = Calendar.getInstance().apply {
            set(Calendar.YEAR, year)
            set(Calendar.DAY_OF_YEAR, 1)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val start = cal.timeInMillis
        cal.add(Calendar.YEAR, 1)
        val end = cal.timeInMillis
        return dao.getEntriesBetweenDates(start, end - 1)
    }

    /**
     * Calculates consecutive-month ministry streak ending at current month.
     * Uses arithmetic keys (year * 12 + month) to avoid string allocations and memory overhead.
     */
    fun calculateStreak(entries: List<MinistryEntry>): Int {
        if (entries.isEmpty()) return 0
        val monthYearSet = HashSet<Int>(entries.size)
        val cal = Calendar.getInstance()
        entries.forEach { entry ->
            if (entry.durationMinutes > 0) {
                cal.timeInMillis = entry.dateMillis
                val key = cal.get(Calendar.YEAR) * 12 + cal.get(Calendar.MONTH)
                monthYearSet.add(key)
            }
        }

        val checkCal = Calendar.getInstance()
        var currentYearMonth = checkCal.get(Calendar.YEAR) * 12 + checkCal.get(Calendar.MONTH)
        var streak = 0

        // Check if current month has activity. If not, check if previous month had activity (grace check)
        val hasCurrentMonth = monthYearSet.contains(currentYearMonth)

        if (!hasCurrentMonth) {
            // Check previous month
            currentYearMonth -= 1
            if (!monthYearSet.contains(currentYearMonth)) {
                return 0
            }
        } else {
            streak++
            currentYearMonth -= 1
        }

        while (monthYearSet.contains(currentYearMonth)) {
            streak++
            currentYearMonth -= 1
        }

        return streak
    }
}
