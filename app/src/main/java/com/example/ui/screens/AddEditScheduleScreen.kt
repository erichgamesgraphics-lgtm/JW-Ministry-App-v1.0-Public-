package com.example.ui.screens

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Title
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.data.model.ReminderOption
import com.example.data.model.RepeatOption
import com.example.data.model.ScheduledEvent
import com.example.ui.viewmodel.MinistryViewModel
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditScheduleScreen(
    viewModel: MinistryViewModel,
    eventId: Long?,
    initialDateMillis: Long? = null,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current

    var title by remember { mutableStateOf("") }
    var selectedDateMillis by remember {
        mutableLongStateOf(initialDateMillis ?: System.currentTimeMillis())
    }
    var startHour by remember { mutableIntStateOf(9) }
    var startMinute by remember { mutableIntStateOf(30) }
    var endHour by remember { mutableIntStateOf(11) }
    var endMinute by remember { mutableIntStateOf(30) }
    var location by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var selectedReminder by remember { mutableStateOf(ReminderOption.MINUTES_15) }
    var selectedRepeat by remember { mutableStateOf(RepeatOption.NONE) }

    var reminderMenuExpanded by remember { mutableStateOf(false) }
    var repeatMenuExpanded by remember { mutableStateOf(false) }
    var existingEvent by remember { mutableStateOf<ScheduledEvent?>(null) }
    var showDeleteConfirm by remember { mutableStateOf(false) }

    // Load existing event
    LaunchedEffect(eventId) {
        if (eventId != null && eventId > 0L) {
            val event = viewModel.scheduledEvents.value.find { it.id == eventId }
            if (event != null) {
                existingEvent = event
                title = event.title
                selectedDateMillis = event.dateMillis
                location = event.location
                description = event.description
                selectedReminder = ReminderOption.fromMinutes(event.reminderMinutesBefore)
                selectedRepeat = event.repeatOption

                if (event.startTimeMillis > 0) {
                    val cal = Calendar.getInstance().apply { timeInMillis = event.startTimeMillis }
                    startHour = cal.get(Calendar.HOUR_OF_DAY)
                    startMinute = cal.get(Calendar.MINUTE)
                }
                if (event.endTimeMillis > 0) {
                    val cal = Calendar.getInstance().apply { timeInMillis = event.endTimeMillis }
                    endHour = cal.get(Calendar.HOUR_OF_DAY)
                    endMinute = cal.get(Calendar.MINUTE)
                }
            }
        }
    }

    val dateFormat = SimpleDateFormat("EEEE, MMMM dd, yyyy", Locale.getDefault())
    val timeFormat = SimpleDateFormat("hh:mm a", Locale.getDefault())

    fun formatTime(h: Int, m: Int): String {
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, h)
            set(Calendar.MINUTE, m)
        }
        return timeFormat.format(cal.time)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (existingEvent != null) "Edit Ministry Schedule" else "Schedule Ministry",
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack, modifier = Modifier.testTag("schedule_back_button")) {
                        Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    if (existingEvent != null) {
                        IconButton(onClick = { showDeleteConfirm = true }) {
                            Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Title input
            item {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Title") },
                    placeholder = { Text("e.g. Saturday Morning Ministry") },
                    leadingIcon = { Icon(imageVector = Icons.Default.Title, contentDescription = null) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("schedule_title_input"),
                    shape = RoundedCornerShape(14.dp),
                    singleLine = true
                )
            }

            // Date picker card
            item {
                Text(
                    text = "Date",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            val cal = Calendar.getInstance().apply { timeInMillis = selectedDateMillis }
                            DatePickerDialog(
                                context,
                                { _, y, m, d ->
                                    val newCal = Calendar.getInstance().apply {
                                        set(Calendar.YEAR, y)
                                        set(Calendar.MONTH, m)
                                        set(Calendar.DAY_OF_MONTH, d)
                                    }
                                    selectedDateMillis = newCal.timeInMillis
                                },
                                cal.get(Calendar.YEAR),
                                cal.get(Calendar.MONTH),
                                cal.get(Calendar.DAY_OF_MONTH)
                            ).show()
                        }
                        .testTag("schedule_date_picker"),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Icon(imageVector = Icons.Default.CalendarMonth, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Text(
                                text = dateFormat.format(Date(selectedDateMillis)),
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = FontWeight.Medium
                            )
                        }
                        Text("Change", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            // Time row
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedCard(
                        modifier = Modifier
                            .weight(1f)
                            .clickable {
                                TimePickerDialog(
                                    context,
                                    { _, h, m ->
                                        startHour = h
                                        startMinute = m
                                    },
                                    startHour,
                                    startMinute,
                                    false
                                ).show()
                            },
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Start Time", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(formatTime(startHour, startMinute), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        }
                    }

                    OutlinedCard(
                        modifier = Modifier
                            .weight(1f)
                            .clickable {
                                TimePickerDialog(
                                    context,
                                    { _, h, m ->
                                        endHour = h
                                        endMinute = m
                                    },
                                    endHour,
                                    endMinute,
                                    false
                                ).show()
                            },
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("End Time", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(formatTime(endHour, endMinute), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Location
            item {
                OutlinedTextField(
                    value = location,
                    onValueChange = { location = it },
                    label = { Text("Location (Optional)") },
                    placeholder = { Text("e.g. Kingdom Hall, Corner of 5th Ave") },
                    leadingIcon = { Icon(imageVector = Icons.Default.LocationOn, contentDescription = null) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("schedule_location_input"),
                    shape = RoundedCornerShape(14.dp),
                    singleLine = true
                )
            }

            // Reminder Dropdown
            item {
                ExposedDropdownMenuBox(
                    expanded = reminderMenuExpanded,
                    onExpandedChange = { reminderMenuExpanded = !reminderMenuExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedReminder.displayName,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Reminder") },
                        leadingIcon = { Icon(imageVector = Icons.Default.Notifications, contentDescription = null) },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = reminderMenuExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                            .testTag("schedule_reminder_dropdown"),
                        shape = RoundedCornerShape(14.dp)
                    )
                    ExposedDropdownMenu(
                        expanded = reminderMenuExpanded,
                        onDismissRequest = { reminderMenuExpanded = false }
                    ) {
                        ReminderOption.entries.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option.displayName) },
                                onClick = {
                                    selectedReminder = option
                                    reminderMenuExpanded = false
                                }
                            )
                        }
                    }
                }
            }

            // Repeat Dropdown
            item {
                ExposedDropdownMenuBox(
                    expanded = repeatMenuExpanded,
                    onExpandedChange = { repeatMenuExpanded = !repeatMenuExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedRepeat.displayName,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Repeat") },
                        leadingIcon = { Icon(imageVector = Icons.Default.Repeat, contentDescription = null) },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = repeatMenuExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                            .testTag("schedule_repeat_dropdown"),
                        shape = RoundedCornerShape(14.dp)
                    )
                    ExposedDropdownMenu(
                        expanded = repeatMenuExpanded,
                        onDismissRequest = { repeatMenuExpanded = false }
                    ) {
                        RepeatOption.entries.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option.displayName) },
                                onClick = {
                                    selectedRepeat = option
                                    repeatMenuExpanded = false
                                }
                            )
                        }
                    }
                }
            }

            // Description / Notes
            item {
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description (Optional)") },
                    placeholder = { Text("e.g. Bring magazines, carpooling with Brother Mark") },
                    leadingIcon = { Icon(imageVector = Icons.Default.Description, contentDescription = null) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("schedule_desc_input"),
                    shape = RoundedCornerShape(14.dp),
                    minLines = 3
                )
            }

            // Save Schedule Button
            item {
                Button(
                    onClick = {
                        val startCal = Calendar.getInstance().apply {
                            timeInMillis = selectedDateMillis
                            set(Calendar.HOUR_OF_DAY, startHour)
                            set(Calendar.MINUTE, startMinute)
                        }
                        val endCal = Calendar.getInstance().apply {
                            timeInMillis = selectedDateMillis
                            set(Calendar.HOUR_OF_DAY, endHour)
                            set(Calendar.MINUTE, endMinute)
                        }

                        viewModel.saveScheduledEvent(
                            id = eventId ?: 0L,
                            title = title.ifBlank { "Ministry Activity" },
                            dateMillis = selectedDateMillis,
                            startTimeMillis = startCal.timeInMillis,
                            endTimeMillis = endCal.timeInMillis,
                            location = location,
                            description = description,
                            reminderMinutesBefore = selectedReminder.minutesBefore,
                            repeatOption = selectedRepeat
                        )
                        onNavigateBack()
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp)
                        .testTag("schedule_save_button"),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text("Save Schedule", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                }
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }

    if (showDeleteConfirm && existingEvent != null) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Delete Scheduled Event") },
            text = { Text("Are you sure you want to remove this scheduled ministry arrangement?") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deleteScheduledEvent(existingEvent!!)
                        showDeleteConfirm = false
                        onNavigateBack()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
