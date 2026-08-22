package com.example.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.example.data.model.MinistryEntry
import com.example.data.model.ScheduledEvent
import com.example.data.model.TimerStateEntity
import com.example.data.model.UserSettings

@Database(
    entities = [
        MinistryEntry::class,
        ScheduledEvent::class,
        UserSettings::class,
        TimerStateEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun ministryEntryDao(): MinistryEntryDao
    abstract fun scheduledEventDao(): ScheduledEventDao
    abstract fun userSettingsDao(): UserSettingsDao
    abstract fun timerStateDao(): TimerStateDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "ministry_tracker_db"
                )
                .fallbackToDestructiveMigration(dropAllTables = true)
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
