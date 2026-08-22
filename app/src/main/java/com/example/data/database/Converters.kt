package com.example.data.database

import androidx.room.TypeConverter
import com.example.data.model.MinistryType
import com.example.data.model.PublisherStatus
import com.example.data.model.RepeatOption

class Converters {
    @TypeConverter
    fun fromMinistryType(value: MinistryType): String = value.name

    @TypeConverter
    fun toMinistryType(value: String): MinistryType = MinistryType.fromString(value)

    @TypeConverter
    fun fromPublisherStatus(value: PublisherStatus): String = value.name

    @TypeConverter
    fun toPublisherStatus(value: String): PublisherStatus = PublisherStatus.fromString(value)

    @TypeConverter
    fun fromRepeatOption(value: RepeatOption): String = value.name

    @TypeConverter
    fun toRepeatOption(value: String): RepeatOption = RepeatOption.fromString(value)
}
