package com.example.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.outlined.BarChart
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.Timer
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String) {
    data object Welcome : Screen("welcome")
    data object Home : Screen("home")
    data object Activity : Screen("activity")
    data object Calendar : Screen("calendar")
    data object Reports : Screen("reports")
    data object Settings : Screen("settings")

    data object AddEditEntry : Screen("add_edit_entry?entryId={entryId}&duration={duration}") {
        fun createRoute(entryId: Long = 0L, duration: Int = 0): String {
            return "add_edit_entry?entryId=$entryId&duration=$duration"
        }
    }

    data object AddEditSchedule : Screen("add_edit_schedule?eventId={eventId}&dateMillis={dateMillis}") {
        fun createRoute(eventId: Long = 0L, dateMillis: Long = 0L): String {
            return "add_edit_schedule?eventId=$eventId&dateMillis=$dateMillis"
        }
    }
}

enum class BottomNavItem(
    val screen: Screen,
    val title: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
) {
    HOME(Screen.Home, "Home", Icons.Filled.Home, Icons.Outlined.Home),
    ACTIVITY(Screen.Activity, "Activity", Icons.Filled.Timer, Icons.Outlined.Timer),
    CALENDAR(Screen.Calendar, "Calendar", Icons.Filled.CalendarMonth, Icons.Outlined.CalendarMonth),
    REPORTS(Screen.Reports, "Reports", Icons.Filled.BarChart, Icons.Outlined.BarChart),
    SETTINGS(Screen.Settings, "Settings", Icons.Filled.Settings, Icons.Outlined.Settings)
}
