package com.example.data.model

enum class PublisherStatus(val displayName: String, val defaultGoalHours: Int) {
    PUBLISHER("Publisher", 0),
    AUXILIARY_PIONEER_15("Auxiliary Pioneer (15h)", 15),
    AUXILIARY_PIONEER_30("Auxiliary Pioneer (30h)", 30),
    REGULAR_PIONEER_50("Regular Pioneer (50h)", 50),
    SPECIAL_PIONEER_100("Special Pioneer (100h)", 100),
    CUSTOM("Custom Goal", 0);

    companion object {
        fun fromString(value: String): PublisherStatus {
            return entries.find { it.name.equals(value, ignoreCase = true) || it.displayName.equals(value, ignoreCase = true) } ?: PUBLISHER
        }
    }
}

enum class MinistryType(val displayName: String, val iconName: String) {
    HOUSE_TO_HOUSE("House-to-house", "home"),
    PUBLIC_WITNESSING("Public witnessing", "groups"),
    INFORMAL_WITNESSING("Informal witnessing", "chat"),
    TELEPHONE_WITNESSING("Telephone witnessing", "phone"),
    LETTER_WRITING("Letter writing", "mail"),
    CART_WITNESSING("Cart witnessing", "storefront"),
    OTHER("Other", "more_horiz");

    companion object {
        fun fromString(value: String): MinistryType {
            return entries.find { it.name.equals(value, ignoreCase = true) || it.displayName.equals(value, ignoreCase = true) } ?: HOUSE_TO_HOUSE
        }
    }
}

enum class ReminderOption(val displayName: String, val minutesBefore: Int) {
    AT_EVENT_TIME("At event time", 0),
    MINUTES_5("5 minutes before", 5),
    MINUTES_15("15 minutes before", 15),
    MINUTES_30("30 minutes before", 30),
    HOURS_1("1 hour before", 60),
    DAYS_1("1 day before", 1440);

    companion object {
        fun fromMinutes(minutes: Int): ReminderOption {
            return entries.find { it.minutesBefore == minutes } ?: MINUTES_15
        }
    }
}

enum class RepeatOption(val displayName: String) {
    NONE("None"),
    DAILY("Daily"),
    WEEKLY("Weekly"),
    MONTHLY("Monthly"),
    YEARLY("Yearly");

    companion object {
        fun fromString(value: String): RepeatOption {
            return entries.find { it.name.equals(value, ignoreCase = true) || it.displayName.equals(value, ignoreCase = true) } ?: NONE
        }
    }
}
