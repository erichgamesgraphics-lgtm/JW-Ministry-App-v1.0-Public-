package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Event
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.MinistryEntry
import com.example.data.model.ScheduledEvent
import com.example.ui.components.EmptyStateView
import com.example.ui.components.MinistryEntryCard
import com.example.ui.viewmodel.MinistryViewModel
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

@Composable
fun CalendarScreen(
    viewModel: MinistryViewModel,
    onAddScheduleClick: (selectedDateMillis: Long) -> Unit,
    onEditScheduleClick: (Long) -> Unit,
    onEditEntryClick: (Long) -> Unit,
    onAddEntryClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    var calendarMonthOffset by remember { mutableIntStateOf(0) }
    var selectedDateMillis by remember {
        val today = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        mutableStateOf(today.timeInMillis)
    }

    val allEntries by viewModel.allEntries.collectAsState()
    val allEvents by viewModel.scheduledEvents.collectAsState()

    // Base calendar for current display month
    val displayCalendar = remember(calendarMonthOffset) {
        Calendar.getInstance().apply {
            set(Calendar.DAY_OF_MONTH, 1)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            add(Calendar.MONTH, calendarMonthOffset)
        }
    }

    val displayYear = displayCalendar.get(Calendar.YEAR)
    val displayMonth = displayCalendar.get(Calendar.MONTH)

    val monthNameYear = remember(calendarMonthOffset) {
        SimpleDateFormat("MMMM yyyy", Locale.getDefault()).format(displayCalendar.time)
    }

    // Today's date components
    val todayCal = remember { Calendar.getInstance() }
    val todayYear = todayCal.get(Calendar.YEAR)
    val todayMonth = todayCal.get(Calendar.MONTH)
    val todayDay = todayCal.get(Calendar.DAY_OF_MONTH)

    // Days in current display month
    val maxDaysInMonth = displayCalendar.getActualMaximum(Calendar.DAY_OF_MONTH)
    val firstDayOfWeek = displayCalendar.get(Calendar.DAY_OF_WEEK) // 1 = Sunday, 7 = Saturday
    val emptyPrecedingDays = firstDayOfWeek - 1

    // Precalculate timestamps for each day of the month to avoid 42 Calendar instantiations in Compose loop
    val dayTimestamps = remember(calendarMonthOffset, maxDaysInMonth) {
        val cal = Calendar.getInstance().apply {
            set(Calendar.YEAR, displayYear)
            set(Calendar.MONTH, displayMonth)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        LongArray(maxDaysInMonth + 1) { day ->
            if (day == 0) 0L
            else {
                cal.set(Calendar.DAY_OF_MONTH, day)
                cal.timeInMillis
            }
        }
    }

    // Map days with activity (Single fast scan using integer comparisons)
    val ministryDaysInMonth = remember(allEntries, calendarMonthOffset) {
        val set = HashSet<Int>()
        val cal = Calendar.getInstance()
        for (i in allEntries.indices) {
            val entry = allEntries[i]
            cal.timeInMillis = entry.dateMillis
            if (cal.get(Calendar.YEAR) == displayYear && cal.get(Calendar.MONTH) == displayMonth) {
                set.add(cal.get(Calendar.DAY_OF_MONTH))
            }
        }
        set
    }

    val eventDaysInMonth = remember(allEvents, calendarMonthOffset) {
        val set = HashSet<Int>()
        val cal = Calendar.getInstance()
        for (i in allEvents.indices) {
            val event = allEvents[i]
            cal.timeInMillis = event.dateMillis
            if (cal.get(Calendar.YEAR) == displayYear && cal.get(Calendar.MONTH) == displayMonth) {
                set.add(cal.get(Calendar.DAY_OF_MONTH))
            }
        }
        set
    }

    // Filter items for selected day
    val selectedDayEntries = remember(allEntries, selectedDateMillis) {
        val selCal = Calendar.getInstance().apply { timeInMillis = selectedDateMillis }
        val y = selCal.get(Calendar.YEAR)
        val m = selCal.get(Calendar.MONTH)
        val d = selCal.get(Calendar.DAY_OF_MONTH)
        val c = Calendar.getInstance()
        allEntries.filter {
            c.timeInMillis = it.dateMillis
            c.get(Calendar.YEAR) == y && c.get(Calendar.MONTH) == m && c.get(Calendar.DAY_OF_MONTH) == d
        }
    }

    val selectedDayEvents = remember(allEvents, selectedDateMillis) {
        val selCal = Calendar.getInstance().apply { timeInMillis = selectedDateMillis }
        val y = selCal.get(Calendar.YEAR)
        val m = selCal.get(Calendar.MONTH)
        val d = selCal.get(Calendar.DAY_OF_MONTH)
        val c = Calendar.getInstance()
        allEvents.filter {
            c.timeInMillis = it.dateMillis
            c.get(Calendar.YEAR) == y && c.get(Calendar.MONTH) == m && c.get(Calendar.DAY_OF_MONTH) == d
        }
    }

    val selectedDateFormat = remember { SimpleDateFormat("EEEE, MMMM dd, yyyy", Locale.getDefault()) }
    val selectedDateString = remember(selectedDateMillis) { selectedDateFormat.format(Date(selectedDateMillis)) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 18.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Calendar",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        // Monthly Calendar Card
        item {
            ElevatedCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("calendar_month_card"),
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    // Month Navigation Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = { calendarMonthOffset-- },
                            modifier = Modifier.testTag("calendar_prev_month_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.ChevronLeft,
                                contentDescription = "Previous month",
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }

                        Text(
                            text = monthNameYear,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        IconButton(
                            onClick = { calendarMonthOffset++ },
                            modifier = Modifier.testTag("calendar_next_month_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.ChevronRight,
                                contentDescription = "Next month",
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Day of Week Names: Sun Mon Tue Wed Thu Fri Sat
                    val daysOfWeek = listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        daysOfWeek.forEach { dayName ->
                            Text(
                                text = dayName,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.weight(1f),
                                textAlign = TextAlign.Center
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Calendar Grid (7 columns)
                    val totalSlots = emptyPrecedingDays + maxDaysInMonth
                    val rowsCount = (totalSlots + 6) / 7

                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        for (row in 0 until rowsCount) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceAround
                            ) {
                                for (col in 0 until 7) {
                                    val slotIndex = row * 7 + col
                                    val dayNumber = slotIndex - emptyPrecedingDays + 1

                                    if (dayNumber in 1..maxDaysInMonth) {
                                        val thisDateMillis = dayTimestamps[dayNumber]
                                        val isToday = (displayYear == todayYear &&
                                                displayMonth == todayMonth &&
                                                dayNumber == todayDay)

                                        val isSelected = thisDateMillis == selectedDateMillis
                                        val hasMinistry = ministryDaysInMonth.contains(dayNumber)
                                        val hasEvent = eventDaysInMonth.contains(dayNumber)

                                        Box(
                                            modifier = Modifier
                                                .weight(1f)
                                                .aspectRatio(1f)
                                                .padding(2.dp)
                                                .clip(CircleShape)
                                                .background(
                                                    when {
                                                        isSelected -> MaterialTheme.colorScheme.primary
                                                        isToday -> MaterialTheme.colorScheme.primaryContainer
                                                        else -> Color.Transparent
                                                    }
                                                )
                                                .clickable {
                                                    selectedDateMillis = thisDateMillis
                                                }
                                                .testTag("calendar_day_$dayNumber"),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Column(
                                                horizontalAlignment = Alignment.CenterHorizontally,
                                                verticalArrangement = Arrangement.Center
                                            ) {
                                                Text(
                                                    text = "$dayNumber",
                                                    style = MaterialTheme.typography.bodyMedium,
                                                    fontWeight = if (isSelected || isToday) FontWeight.Bold else FontWeight.Normal,
                                                    color = when {
                                                        isSelected -> MaterialTheme.colorScheme.onPrimary
                                                        isToday -> MaterialTheme.colorScheme.onPrimaryContainer
                                                        else -> MaterialTheme.colorScheme.onSurface
                                                    }
                                                )

                                                // Indicators Row (Ministry dot & Event dot)
                                                if (hasMinistry || hasEvent) {
                                                    Row(
                                                        horizontalArrangement = Arrangement.spacedBy(2.dp),
                                                        modifier = Modifier.padding(top = 1.dp)
                                                    ) {
                                                        if (hasMinistry) {
                                                            Box(
                                                                modifier = Modifier
                                                                    .size(4.dp)
                                                                    .clip(CircleShape)
                                                                    .background(if (isSelected) Color.White else MaterialTheme.colorScheme.primary)
                                                            )
                                                        }
                                                        if (hasEvent) {
                                                            Box(
                                                                modifier = Modifier
                                                                    .size(4.dp)
                                                                    .clip(CircleShape)
                                                                    .background(if (isSelected) Color.White else Color(0xFFC07000))
                                                            )
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        // Empty slot
                                        Spacer(modifier = Modifier.weight(1f).aspectRatio(1f))
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Legend
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary))
                            Text("Ministry Activity", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(Color(0xFFC07000)))
                            Text("Scheduled Event", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
        }

        // Schedule Ministry Action Button
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Button(
                    onClick = { onAddScheduleClick(selectedDateMillis) },
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .testTag("calendar_schedule_button"),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                ) {
                    Icon(imageVector = Icons.Default.Event, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Schedule Ministry", style = MaterialTheme.typography.labelLarge)
                }

                OutlinedButton(
                    onClick = onAddEntryClick,
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .testTag("calendar_record_entry_button"),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Record Entry", style = MaterialTheme.typography.labelLarge)
                }
            }
        }

        // Selected Date Information
        item {
            Text(
                text = selectedDateString,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        // Scheduled Events on this day
        if (selectedDayEvents.isNotEmpty()) {
            item {
                Text(
                    text = "Scheduled Ministry (${selectedDayEvents.size})",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.secondary
                )
            }
            items(selectedDayEvents, key = { "event_${it.id}" }) { event ->
                val timeFormat = SimpleDateFormat("hh:mm a", Locale.getDefault())
                val timeStr = if (event.startTimeMillis > 0) {
                    "${timeFormat.format(Date(event.startTimeMillis))} - ${timeFormat.format(Date(event.endTimeMillis))}"
                } else "All Day"

                ElevatedCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onEditScheduleClick(event.id) }
                        .testTag("scheduled_event_card_${event.id}"),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = event.title,
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = timeStr,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                            if (event.location.isNotBlank()) {
                                Spacer(modifier = Modifier.height(2.dp))
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(imageVector = Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Text(event.location, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }

                        IconButton(onClick = { viewModel.deleteScheduledEvent(event) }) {
                            Icon(
                                imageVector = Icons.Default.Delete,
                                contentDescription = "Delete event",
                                tint = MaterialTheme.colorScheme.error,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }

        // Ministry Sessions recorded on this day
        if (selectedDayEntries.isNotEmpty()) {
            item {
                Text(
                    text = "Ministry Sessions (${selectedDayEntries.size})",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            items(selectedDayEntries, key = { "entry_${it.id}" }) { entry ->
                MinistryEntryCard(
                    entry = entry,
                    onClick = { onEditEntryClick(entry.id) },
                    onDelete = { viewModel.deleteMinistryEntry(entry) }
                )
            }
        }

        // If neither events nor entries on this day
        if (selectedDayEvents.isEmpty() && selectedDayEntries.isEmpty()) {
            item {
                EmptyStateView(
                    icon = Icons.Default.CalendarToday,
                    title = "No Activity Recorded",
                    message = "No ministry sessions or arrangements recorded for this day."
                )
            }
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
