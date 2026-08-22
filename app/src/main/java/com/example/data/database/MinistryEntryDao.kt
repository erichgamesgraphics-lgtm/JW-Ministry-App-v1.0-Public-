package com.example.data.database

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.data.model.MinistryEntry
import kotlinx.coroutines.flow.Flow

@Dao
interface MinistryEntryDao {
    @Query("SELECT * FROM ministry_entries ORDER BY dateMillis DESC, startTimeMillis DESC, id DESC")
    fun getAllEntries(): Flow<List<MinistryEntry>>

    @Query("SELECT * FROM ministry_entries WHERE id = :id")
    suspend fun getEntryById(id: Long): MinistryEntry?

    @Query("SELECT * FROM ministry_entries WHERE dateMillis >= :startOfDayMillis AND dateMillis < :endOfDayMillis ORDER BY startTimeMillis DESC")
    fun getEntriesForDateRange(startOfDayMillis: Long, endOfDayMillis: Long): Flow<List<MinistryEntry>>

    @Query("SELECT * FROM ministry_entries WHERE dateMillis >= :startMillis AND dateMillis <= :endMillis ORDER BY dateMillis ASC")
    fun getEntriesBetweenDates(startMillis: Long, endMillis: Long): Flow<List<MinistryEntry>>

    @Query("SELECT * FROM ministry_entries WHERE isSynced = 0")
    suspend fun getUnsyncedEntries(): List<MinistryEntry>

    @Query("SELECT * FROM ministry_entries ORDER BY dateMillis DESC, startTimeMillis DESC")
    suspend fun getAllEntriesList(): List<MinistryEntry>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEntry(entry: MinistryEntry): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(entries: List<MinistryEntry>)

    @Update
    suspend fun updateEntry(entry: MinistryEntry)

    @Delete
    suspend fun deleteEntry(entry: MinistryEntry)

    @Query("DELETE FROM ministry_entries WHERE id = :id")
    suspend fun deleteEntryById(id: Long)

    @Query("DELETE FROM ministry_entries")
    suspend fun deleteAll()

    @Query("""
        SELECT * FROM ministry_entries 
        WHERE notes LIKE '%' || :query || '%' 
           OR location LIKE '%' || :query || '%' 
           OR ministryType LIKE '%' || :query || '%'
        ORDER BY dateMillis DESC
    """)
    fun searchEntries(query: String): Flow<List<MinistryEntry>>
}
