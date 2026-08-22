package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
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
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.MinistryEntry
import com.example.ui.components.EmptyStateView
import com.example.ui.components.MinistryEntryCard
import com.example.ui.viewmodel.MinistryViewModel
import java.util.Locale

@Composable
fun ActivityScreen(
    viewModel: MinistryViewModel,
    onEditEntryClick: (Long) -> Unit,
    onSaveTimerSessionClick: (durationMinutes: Int) -> Unit,
    onAddManualEntryClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val entries by viewModel.allEntries.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    var entryToDelete by remember { mutableStateOf<MinistryEntry?>(null) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 18.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Activity",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        // Dedicated Isolated Timer Card (recompositions isolated to this card)
        item {
            MinistryLiveTimerCard(
                viewModel = viewModel,
                onSaveTimerSessionClick = onSaveTimerSessionClick
            )
        }

        // History Section Header & Search Bar
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "History",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )

                Text(
                    text = "${entries.size} ${if (entries.size == 1) "entry" else "entries"}",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        item {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { viewModel.searchQuery.value = it },
                placeholder = { Text("Search by type, location, or notes...") },
                leadingIcon = { Icon(imageVector = Icons.Default.Search, contentDescription = null) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { viewModel.searchQuery.value = "" }) {
                            Icon(imageVector = Icons.Default.Clear, contentDescription = "Clear search")
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("activity_search_field"),
                shape = RoundedCornerShape(14.dp),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                    focusedContainerColor = MaterialTheme.colorScheme.surface
                )
            )
        }

        // History Items List or Empty State
        if (entries.isEmpty()) {
            item {
                EmptyStateView(
                    icon = Icons.Default.History,
                    title = if (searchQuery.isBlank()) "No ministry entries yet" else "No matching entries found",
                    message = if (searchQuery.isBlank()) "Use the timer above or record an entry manually to start tracking your ministry." else "Try searching with a different keyword.",
                    actionButtonText = if (searchQuery.isBlank()) "+ Add Manual Entry" else null,
                    onActionClick = if (searchQuery.isBlank()) onAddManualEntryClick else null
                )
            }
        } else {
            items(entries, key = { it.id }) { entry ->
                MinistryEntryCard(
                    entry = entry,
                    onClick = { onEditEntryClick(entry.id) },
                    onDelete = { entryToDelete = entry }
                )
            }
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }

    // Delete Item Confirmation Dialog
    if (entryToDelete != null) {
        AlertDialog(
            onDismissRequest = { entryToDelete = null },
            title = { Text("Delete Entry") },
            text = { Text("Are you sure you want to delete this ministry entry?") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deleteMinistryEntry(entryToDelete!!)
                        entryToDelete = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { entryToDelete = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

/**
 * Isolated Live Timer Card Composable
 * Only this composable recomposes as seconds advance, keeping scrolling and list performance optimal.
 */
@Composable
private fun MinistryLiveTimerCard(
    viewModel: MinistryViewModel,
    onSaveTimerSessionClick: (Int) -> Unit
) {
    val timerEntity by viewModel.timerEntity.collectAsState()
    val timerSeconds by viewModel.currentTimerSeconds.collectAsState()
    var showStopDialog by remember { mutableStateOf(false) }

    // Format HH:MM:SS
    val hours = timerSeconds / 3600
    val minutes = (timerSeconds % 3600) / 60
    val seconds = timerSeconds % 60
    val timeFormatted = String.format(Locale.getDefault(), "%02d:%02d:%02d", hours, minutes, seconds)

    ElevatedCard(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("activity_timer_card"),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.elevatedCardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 3.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Timer,
                    contentDescription = null,
                    tint = if (timerEntity.isRunning && !timerEntity.isPaused) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = when {
                        timerEntity.isRunning && !timerEntity.isPaused -> "Active Ministry Session"
                        timerEntity.isRunning && timerEntity.isPaused -> "Timer Paused"
                        else -> "Ministry Timer"
                    },
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Big HH:MM:SS display
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(18.dp))
                    .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f))
                    .padding(horizontal = 24.dp, vertical = 14.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = timeFormatted,
                    style = MaterialTheme.typography.displayMedium.copy(
                        fontSize = 42.sp,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 2.sp
                    ),
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                    modifier = Modifier.testTag("timer_display_text")
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Timer Control Buttons
            if (!timerEntity.isRunning) {
                // Initial Start button
                Button(
                    onClick = { viewModel.startTimer() },
                    modifier = Modifier
                        .fillMaxWidth(0.8f)
                        .height(52.dp)
                        .testTag("timer_start_button"),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Icon(imageVector = Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(24.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Start",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
            } else {
                // Running/Paused Controls: Pause/Resume + Stop
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    if (!timerEntity.isPaused) {
                        Button(
                            onClick = { viewModel.pauseTimer() },
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp)
                                .testTag("timer_pause_button"),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEAB308))
                        ) {
                            Icon(imageVector = Icons.Default.Pause, contentDescription = null, tint = Color.Black)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Pause", color = Color.Black, fontWeight = FontWeight.Bold)
                        }
                    } else {
                        Button(
                            onClick = { viewModel.resumeTimer() },
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp)
                                .testTag("timer_resume_button"),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                        ) {
                            Icon(imageVector = Icons.Default.PlayArrow, contentDescription = null)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Resume", fontWeight = FontWeight.Bold)
                        }
                    }

                    Button(
                        onClick = { showStopDialog = true },
                        modifier = Modifier
                            .weight(1f)
                            .height(50.dp)
                            .testTag("timer_stop_button"),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                    ) {
                        Icon(imageVector = Icons.Default.Stop, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Stop", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // Stop Session Confirmation Dialog
    if (showStopDialog) {
        AlertDialog(
            onDismissRequest = { showStopDialog = false },
            title = { Text("Finish Ministry Session") },
            text = {
                val mins = maxOf(1, ((timerSeconds + 30) / 60).toInt())
                val h = mins / 60
                val m = mins % 60
                Text("You recorded ${if (h > 0) "${h}h ${m}m" else "${m}m"}. Would you like to save this session to your ministry history?")
            },
            confirmButton = {
                Button(
                    onClick = {
                        showStopDialog = false
                        viewModel.stopTimer { minutesRecorded ->
                            onSaveTimerSessionClick(minutesRecorded)
                        }
                    },
                    modifier = Modifier.testTag("dialog_save_session_button")
                ) {
                    Text("Save Session")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        showStopDialog = false
                        viewModel.cancelTimer()
                    }
                ) {
                    Text("Discard", color = MaterialTheme.colorScheme.error)
                }
            }
        )
    }
}
