package com.example.ui.screens

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Notes
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.MinistryEntry
import com.example.data.model.MinistryType
import com.example.ui.viewmodel.MinistryViewModel
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun AddEditEntryScreen(
    viewModel: MinistryViewModel,
    entryId: Long?,
    initialDurationMinutes: Int = 0,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current

    var selectedDateMillis by remember { mutableLongStateOf(System.currentTimeMillis()) }
    var startHour by remember { mutableIntStateOf(9) }
    var startMinute by remember { mutableIntStateOf(0) }
    var endHour by remember { mutableIntStateOf(10) }
    var endMinute by remember { mutableIntStateOf(30) }

    var isManualDuration by remember { mutableStateOf(initialDurationMinutes > 0) }
    var manualHours by remember { mutableIntStateOf(initialDurationMinutes / 60) }
    var manualMinutes by remember { mutableIntStateOf(initialDurationMinutes % 60) }

    var selectedType by remember { mutableStateOf(MinistryType.HOUSE_TO_HOUSE) }
    var returnVisits by remember { mutableIntStateOf(0) }
    var bibleStudies by remember { mutableIntStateOf(0) }
    var placements by remember { mutableIntStateOf(0) }
    var location by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }

    var showDeleteConfirmation by remember { mutableStateOf(false) }
    var existingEntry by remember { mutableStateOf<MinistryEntry?>(null) }

    // Load entry if editing
    LaunchedEffect(entryId) {
        if (entryId != null && entryId > 0L) {
            val entry = viewModel.allEntries.value.find { it.id == entryId }
            if (entry != null) {
                existingEntry = entry
                selectedDateMillis = entry.dateMillis
                selectedType = entry.ministryType
                returnVisits = entry.returnVisits
                bibleStudies = entry.bibleStudies
                placements = entry.placements
                location = entry.location
                notes = entry.notes

                isManualDuration = true
                manualHours = entry.durationMinutes / 60
                manualMinutes = entry.durationMinutes % 60

                if (entry.startTimeMillis > 0 && entry.endTimeMillis > 0) {
                    val cal = Calendar.getInstance().apply { timeInMillis = entry.startTimeMillis }
                    startHour = cal.get(Calendar.HOUR_OF_DAY)
                    startMinute = cal.get(Calendar.MINUTE)
                    cal.timeInMillis = entry.endTimeMillis
                    endHour = cal.get(Calendar.HOUR_OF_DAY)
                    endMinute = cal.get(Calendar.MINUTE)
                }
            }
        }
    }

    // Auto duration computation
    val autoDurationMinutes = remember(startHour, startMinute, endHour, endMinute) {
        val startTotal = startHour * 60 + startMinute
        val endTotal = endHour * 60 + endMinute
        if (endTotal >= startTotal) endTotal - startTotal else (24 * 60 - startTotal) + endTotal
    }

    val finalDurationMinutes = if (isManualDuration) {
        manualHours * 60 + manualMinutes
    } else {
        autoDurationMinutes
    }

    val dateFormat = SimpleDateFormat("EEEE, MMMM dd, yyyy", Locale.getDefault())
    val timeFormat = SimpleDateFormat("hh:mm a", Locale.getDefault())

    fun formatTime(hour: Int, minute: Int): String {
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
        }
        return timeFormat.format(cal.time)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (entryId != null && entryId > 0L) "Edit Ministry Entry" else "New Ministry Entry",
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(
                        onClick = onNavigateBack,
                        modifier = Modifier.testTag("entry_back_button")
                    ) {
                        Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    if (existingEntry != null) {
                        IconButton(
                            onClick = { showDeleteConfirmation = true },
                            modifier = Modifier.testTag("entry_delete_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Delete,
                                contentDescription = "Delete",
                                tint = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            // Date Picker Card
            item {
                Text(
                    text = "Date",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(6.dp))
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
                        .testTag("entry_date_picker"),
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
                            Icon(
                                imageVector = Icons.Default.CalendarMonth,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = dateFormat.format(Date(selectedDateMillis)),
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = FontWeight.Medium
                            )
                        }
                        Text(
                            text = "Change",
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            // Duration & Time Section
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Manual Duration Entry",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium
                            )
                            Switch(
                                checked = isManualDuration,
                                onCheckedChange = { isManualDuration = it },
                                modifier = Modifier.testTag("entry_manual_duration_switch")
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        if (!isManualDuration) {
                            // Start & End Time Pickers
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                TimeSelectorBox(
                                    label = "Start Time",
                                    timeStr = formatTime(startHour, startMinute),
                                    modifier = Modifier.weight(1f),
                                    onClick = {
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
                                    }
                                )
                                TimeSelectorBox(
                                    label = "End Time",
                                    timeStr = formatTime(endHour, endMinute),
                                    modifier = Modifier.weight(1f),
                                    onClick = {
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
                                    }
                                )
                            }
                        } else {
                            // Manual Hours & Minutes Steppers
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                NumberStepper(
                                    label = "Hours",
                                    value = manualHours,
                                    onValueChange = { manualHours = maxOf(0, it) },
                                    modifier = Modifier.weight(1f)
                                )
                                NumberStepper(
                                    label = "Minutes",
                                    value = manualMinutes,
                                    step = 5,
                                    onValueChange = { manualMinutes = maxOf(0, minOf(59, it)) },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Total Duration Highlight
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Total Duration:",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            val h = finalDurationMinutes / 60
                            val m = finalDurationMinutes % 60
                            Text(
                                text = "${h}h ${m}m (${finalDurationMinutes} mins)",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }

            // Ministry Type Selector
            item {
                Text(
                    text = "Ministry Type",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(8.dp))
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    MinistryType.entries.forEach { type ->
                        val isSelected = selectedType == type
                        FilterChip(
                            selected = isSelected,
                            onClick = { selectedType = type },
                            label = { Text(type.displayName) },
                            leadingIcon = if (isSelected) {
                                { Icon(imageVector = Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp)) }
                            } else null,
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                                selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        )
                    }
                }
            }

            // Activity Counts: Return Visits, Bible Studies, Placements
            item {
                Text(
                    text = "Activity Counts",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(8.dp))
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    CountRow(
                        title = "Return Visits",
                        value = returnVisits,
                        onValueChange = { returnVisits = maxOf(0, it) }
                    )
                    CountRow(
                        title = "Bible Studies",
                        value = bibleStudies,
                        onValueChange = { bibleStudies = maxOf(0, it) }
                    )
                    CountRow(
                        title = "Placements",
                        value = placements,
                        onValueChange = { placements = maxOf(0, it) }
                    )
                }
            }

            // Location (Optional)
            item {
                OutlinedTextField(
                    value = location,
                    onValueChange = { location = it },
                    label = { Text("Location (Optional)") },
                    placeholder = { Text("e.g. Oak Avenue, City Park Cart") },
                    leadingIcon = {
                        Icon(imageVector = Icons.Default.LocationOn, contentDescription = null)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("entry_location_input"),
                    shape = RoundedCornerShape(14.dp),
                    singleLine = true
                )
            }

            // Notes (Optional)
            item {
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes (Optional)") },
                    placeholder = { Text("e.g. Good discussion on Revelation with John...") },
                    leadingIcon = {
                        Icon(imageVector = Icons.AutoMirrored.Filled.Notes, contentDescription = null)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("entry_notes_input"),
                    shape = RoundedCornerShape(14.dp),
                    minLines = 3,
                    maxLines = 5
                )
            }

            // Save Entry Button
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

                        viewModel.saveMinistryEntry(
                            id = entryId ?: 0L,
                            dateMillis = selectedDateMillis,
                            startTimeMillis = startCal.timeInMillis,
                            endTimeMillis = endCal.timeInMillis,
                            durationMinutes = finalDurationMinutes,
                            ministryType = selectedType,
                            returnVisits = returnVisits,
                            bibleStudies = bibleStudies,
                            placements = placements,
                            location = location,
                            notes = notes
                        )
                        onNavigateBack()
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp)
                        .testTag("entry_save_button"),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Text(
                        text = "Save Entry",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }

    if (showDeleteConfirmation && existingEntry != null) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirmation = false },
            title = { Text("Delete Entry") },
            text = { Text("Are you sure you want to delete this ministry entry? This action cannot be undone.") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deleteMinistryEntry(existingEntry!!)
                        showDeleteConfirmation = false
                        onNavigateBack()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirmation = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
private fun TimeSelectorBox(
    label: String,
    timeStr: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    OutlinedCard(
        modifier = modifier.clickable { onClick() },
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Schedule,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text = timeStr,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
private fun NumberStepper(
    label: String,
    value: Int,
    step: Int = 1,
    onValueChange: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedCard(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(6.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                IconButton(
                    onClick = { onValueChange(value - step) },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(imageVector = Icons.Default.Remove, contentDescription = "Decrease")
                }
                Text(
                    text = "$value",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp)
                )
                IconButton(
                    onClick = { onValueChange(value + step) },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = "Increase")
                }
            }
        }
    }
}

@Composable
private fun CountRow(
    title: String,
    value: Int,
    onValueChange: (Int) -> Unit
) {
    ElevatedCard(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium
            )

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                IconButton(
                    onClick = { onValueChange(value - 1) },
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Icon(imageVector = Icons.Default.Remove, contentDescription = "Decrease", modifier = Modifier.size(18.dp))
                }

                Text(
                    text = "$value",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.width(36.dp),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )

                IconButton(
                    onClick = { onValueChange(value + 1) },
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primaryContainer)
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Increase",
                        modifier = Modifier.size(18.dp),
                        tint = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
        }
    }
}
