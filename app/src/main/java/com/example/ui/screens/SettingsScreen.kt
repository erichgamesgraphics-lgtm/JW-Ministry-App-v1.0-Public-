package com.example.ui.screens

import android.app.TimePickerDialog
import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Brightness4
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.CloudSync
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Policy
import androidx.compose.material.icons.filled.SaveAlt
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Upload
import androidx.compose.material.icons.filled.VpnKey
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.PublisherStatus
import com.example.ui.viewmodel.MinistryViewModel
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

@Composable
fun SettingsScreen(
    viewModel: MinistryViewModel,
    onNavigateToWelcome: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    val settings by viewModel.userSettings.collectAsState()
    val isSyncing by viewModel.isSyncing.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()
    val isAuthenticating by viewModel.isAuthenticating.collectAsState()
    val activity = context as? android.app.Activity

    var showCustomGoalDialog by remember { mutableStateOf(false) }
    var customGoalInput by remember { mutableStateOf("${settings.customGoalHours}") }

    var showRestoreDialog by remember { mutableStateOf(false) }
    var restoreJsonInput by remember { mutableStateOf("") }

    var showWebClientIdDialog by remember { mutableStateOf(false) }
    var webClientIdInput by remember { mutableStateOf(viewModel.getWebClientId()) }

    var showPrivacyDialog by remember { mutableStateOf(false) }
    var showTermsDialog by remember { mutableStateOf(false) }
    var showAboutDialog by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 18.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Settings",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        // Section 1: Publisher Status & Goal
        item {
            SettingsSectionHeader(title = "Publisher Status & Goal")
        }

        item {
            ElevatedCard(
                modifier = Modifier.fillMaxWidth().testTag("settings_status_card"),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    PublisherStatus.entries.forEach { status ->
                        val isSelected = settings.publisherStatus == status
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .clickable {
                                    if (status == PublisherStatus.CUSTOM) {
                                        showCustomGoalDialog = true
                                    } else {
                                        viewModel.updatePublisherStatus(status)
                                    }
                                }
                                .padding(vertical = 8.dp, horizontal = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = isSelected,
                                onClick = {
                                    if (status == PublisherStatus.CUSTOM) {
                                        showCustomGoalDialog = true
                                    } else {
                                        viewModel.updatePublisherStatus(status)
                                    }
                                }
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text(
                                    text = status.displayName,
                                    style = MaterialTheme.typography.bodyLarge,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = when (status) {
                                        PublisherStatus.PUBLISHER -> "Track regular monthly activity without a fixed goal"
                                        PublisherStatus.AUXILIARY_PIONEER_15 -> "Goal: 15 hours per month"
                                        PublisherStatus.AUXILIARY_PIONEER_30 -> "Goal: 30 hours per month"
                                        PublisherStatus.REGULAR_PIONEER_50 -> "Goal: 50 hours per month"
                                        PublisherStatus.SPECIAL_PIONEER_100 -> "Goal: 100 hours per month"
                                        PublisherStatus.CUSTOM -> "Custom goal: ${settings.customGoalHours} hours"
                                    },
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }

        // Section 2: Preferences & Reminders
        item {
            SettingsSectionHeader(title = "Preferences & Reminders")
        }

        item {
            ElevatedCard(
                modifier = Modifier.fillMaxWidth().testTag("settings_prefs_card"),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    // Notifications Toggle
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Icon(imageVector = Icons.Default.Notifications, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Column {
                                Text("Ministry Reminders", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)
                                Text("Notifications for scheduled ministry", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        Switch(
                            checked = settings.notificationsEnabled,
                            onCheckedChange = { viewModel.updateNotifications(it, settings.dailyReminderEnabled, settings.dailyReminderHour, settings.dailyReminderMinute) },
                            modifier = Modifier.testTag("settings_notifications_switch")
                        )
                    }

                    // Daily Reminder Toggle
                    if (settings.notificationsEnabled) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Daily Reminder Time", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                                val hour = settings.dailyReminderHour
                                val min = settings.dailyReminderMinute
                                val timeText = String.format(Locale.getDefault(), "%02d:%02d", hour, min)
                                Text("Remind to record activity at $timeText", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }

                            OutlinedButton(
                                onClick = {
                                    TimePickerDialog(
                                        context,
                                        { _, h, m ->
                                            viewModel.updateNotifications(true, true, h, m)
                                        },
                                        settings.dailyReminderHour,
                                        settings.dailyReminderMinute,
                                        false
                                    ).show()
                                },
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("Set Time")
                            }
                        }
                    }
                }
            }
        }

        // Section 3: Appearance & Theme
        item {
            SettingsSectionHeader(title = "Appearance & Theme")
        }

        item {
            ElevatedCard(
                modifier = Modifier.fillMaxWidth().testTag("settings_theme_card"),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("SYSTEM" to "System Default", "LIGHT" to "Light Mode", "DARK" to "Dark Mode").forEach { (mode, label) ->
                        val isSelected = settings.themeMode == mode
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .clickable { viewModel.updateTheme(mode) }
                                .padding(vertical = 8.dp, horizontal = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = isSelected,
                                onClick = { viewModel.updateTheme(mode) }
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(label, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }
        }

        // Section 4: Data Management & Sync
        item {
            SettingsSectionHeader(title = "Data Management & Cloud Sync")
        }

        item {
            ElevatedCard(
                modifier = Modifier.fillMaxWidth().testTag("settings_data_card"),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    // Sync with Cloud
                    SettingsActionRow(
                        title = "Sync with Cloud Firestore",
                        subtitle = if (viewModel.authAndSyncRepo.isUserSignedIn()) "Signed in as ${viewModel.authAndSyncRepo.currentUser?.email ?: "User"}" else "Offline / Local Mode Active",
                        icon = Icons.Default.CloudSync,
                        onClick = { viewModel.syncWithFirebase() },
                        trailingContent = {
                            if (isSyncing) {
                                CircularProgressIndicator(modifier = Modifier.size(24.dp))
                            }
                        }
                    )

                    // Export to CSV
                    SettingsActionRow(
                        title = "Export Activity to CSV",
                        subtitle = "Spreadsheet format with all recorded fields",
                        icon = Icons.Default.Share,
                        onClick = {
                            coroutineScope.launch {
                                val csv = viewModel.authAndSyncRepo.exportToCsv()
                                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                    type = "text/csv"
                                    putExtra(Intent.EXTRA_SUBJECT, "Ministry Tracker Export.csv")
                                    putExtra(Intent.EXTRA_TEXT, csv)
                                }
                                context.startActivity(Intent.createChooser(shareIntent, "Export CSV"))
                            }
                        }
                    )

                    // Backup JSON
                    SettingsActionRow(
                        title = "Create Full Backup (JSON)",
                        subtitle = "Save all ministry records and schedules safely",
                        icon = Icons.Default.CloudDownload,
                        onClick = {
                            viewModel.createBackup { json ->
                                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                    type = "application/json"
                                    putExtra(Intent.EXTRA_SUBJECT, "Ministry_Tracker_Backup.json")
                                    putExtra(Intent.EXTRA_TEXT, json)
                                }
                                context.startActivity(Intent.createChooser(shareIntent, "Save Backup"))
                            }
                        }
                    )

                    // Restore JSON
                    SettingsActionRow(
                        title = "Restore from JSON Backup",
                        subtitle = "Import records from a previous backup file",
                        icon = Icons.Default.CloudUpload,
                        onClick = { showRestoreDialog = true }
                    )

                    // Configure Google OAuth Client ID
                    SettingsActionRow(
                        title = "Google OAuth Client ID",
                        subtitle = if (viewModel.getWebClientId().isNotBlank()) "Configured (${viewModel.getWebClientId().take(18)}...)" else "Configure Google Web Client ID for Sign-In",
                        icon = Icons.Default.VpnKey,
                        onClick = {
                            webClientIdInput = viewModel.getWebClientId()
                            showWebClientIdDialog = true
                        }
                    )
                }
            }
        }

        // Section 5: Account & Legal
        item {
            SettingsSectionHeader(title = "Account & Legal")
        }

        item {
            ElevatedCard(
                modifier = Modifier.fillMaxWidth().testTag("settings_account_card"),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    if (currentUser != null) {
                        // Signed in User Profile Card
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f))
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(CircleShape)
                                    .background(MaterialTheme.colorScheme.primary),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Person,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onPrimary,
                                    modifier = Modifier.size(26.dp)
                                )
                            }

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = currentUser?.displayName ?: "Ministry Publisher",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = currentUser?.email ?: "Authenticated Account",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    } else {
                        // Guest Mode - Offer Account Link
                        Text(
                            text = "Currently in Guest Mode (Offline)",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = "Sign in to enable automatic cloud backup and sync across devices.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = {
                                    if (activity != null) {
                                        viewModel.signInWithGoogle(
                                            activity = activity,
                                            onSuccess = { /* Profile updates reactively */ },
                                            onError = { /* SnackBar feedback */ }
                                        )
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                enabled = !isAuthenticating,
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Google", fontWeight = FontWeight.SemiBold)
                            }

                            OutlinedButton(
                                onClick = {
                                    if (activity != null) {
                                        viewModel.signInWithApple(
                                            activity = activity,
                                            onSuccess = { /* Profile updates reactively */ },
                                            onError = { /* SnackBar feedback */ }
                                        )
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                enabled = !isAuthenticating,
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Apple", fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }

                    SettingsActionRow(
                        title = "About Ministry Tracker",
                        subtitle = "Version 1.0.0 (JW Edition)",
                        icon = Icons.Default.Info,
                        onClick = { showAboutDialog = true }
                    )

                    SettingsActionRow(
                        title = "Privacy Policy",
                        subtitle = "Your data stays private on your device",
                        icon = Icons.Default.Lock,
                        onClick = { showPrivacyDialog = true }
                    )

                    SettingsActionRow(
                        title = "Terms of Service",
                        subtitle = "Guidelines and terms of use",
                        icon = Icons.Default.Policy,
                        onClick = { showTermsDialog = true }
                    )

                    if (currentUser != null) {
                        SettingsActionRow(
                            title = "Sign Out",
                            subtitle = "Switch accounts or return to welcome screen",
                            icon = Icons.Default.AccountCircle,
                            onClick = {
                                viewModel.signOut { onNavigateToWelcome() }
                            }
                        )
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(24.dp))
        }
    }

    // Custom Goal Dialog
    if (showCustomGoalDialog) {
        AlertDialog(
            onDismissRequest = { showCustomGoalDialog = false },
            title = { Text("Set Custom Monthly Goal") },
            text = {
                Column {
                    Text("Enter your target monthly ministry hours:")
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = customGoalInput,
                        onValueChange = { customGoalInput = it.filter { ch -> ch.isDigit() } },
                        label = { Text("Hours") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val hours = customGoalInput.toIntOrNull() ?: 50
                        viewModel.updatePublisherStatus(PublisherStatus.CUSTOM, hours)
                        showCustomGoalDialog = false
                    }
                ) {
                    Text("Save Goal")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCustomGoalDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Restore JSON Backup Dialog
    if (showRestoreDialog) {
        AlertDialog(
            onDismissRequest = { showRestoreDialog = false },
            title = { Text("Restore from Backup") },
            text = {
                Column {
                    Text("Paste your exported JSON backup text below:")
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = restoreJsonInput,
                        onValueChange = { restoreJsonInput = it },
                        label = { Text("Backup JSON") },
                        minLines = 4,
                        maxLines = 8,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.restoreBackup(restoreJsonInput)
                        showRestoreDialog = false
                        restoreJsonInput = ""
                    }
                ) {
                    Text("Restore")
                }
            },
            dismissButton = {
                TextButton(onClick = { showRestoreDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // About Dialog
    if (showAboutDialog) {
        AlertDialog(
            onDismissRequest = { showAboutDialog = false },
            title = { Text("About Ministry Tracker") },
            text = {
                Text("Ministry Tracker is an elegant, offline-first personal tool designed for Jehovah's Witnesses to organize and track their personal preaching activity, return visits, Bible studies, and scheduled ministry arrangements.\n\nVersion: 1.0.0\nTheme: Soft Blue & Material 3\nBuilt with Kotlin & Jetpack Compose.")
            },
            confirmButton = {
                Button(onClick = { showAboutDialog = false }) {
                    Text("OK")
                }
            }
        )
    }

    // Privacy Policy Dialog
    if (showPrivacyDialog) {
        AlertDialog(
            onDismissRequest = { showPrivacyDialog = false },
            title = { Text("Privacy Policy") },
            text = {
                Text("Your privacy is of the utmost importance.\n\n1. All ministry entries, notes, and schedules are stored securely on your local device.\n2. No personal tracking or telemetry is sent to third parties.\n3. Optional cloud backup synchronizes only with your own secured Firebase account.\n4. You can export or delete your local data at any time.")
            },
            confirmButton = {
                Button(onClick = { showPrivacyDialog = false }) {
                    Text("Close")
                }
            }
        )
    }

    // Terms of Service Dialog
    if (showTermsDialog) {
        AlertDialog(
            onDismissRequest = { showTermsDialog = false },
            title = { Text("Terms of Service") },
            text = {
                Text("Ministry Tracker is provided as a personal assistant tool for Christian ministry organization. Use responsibly in accordance with local regulations and personal scheduling.")
            },
            confirmButton = {
                Button(onClick = { showTermsDialog = false }) {
                    Text("Close")
                }
            }
        )
    }

    // Google OAuth Client ID Dialog
    if (showWebClientIdDialog) {
        AlertDialog(
            onDismissRequest = { showWebClientIdDialog = false },
            title = { Text("Google OAuth Client ID") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Enter your Google Web Client ID (from Firebase Console > Authentication > Google > Web SDK configuration) to enable Google Sign-In:",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    OutlinedTextField(
                        value = webClientIdInput,
                        onValueChange = { webClientIdInput = it },
                        label = { Text("Web Client ID (.apps.googleusercontent.com)") },
                        placeholder = { Text("123456789-abc.apps.googleusercontent.com") },
                        singleLine = false,
                        maxLines = 3,
                        modifier = Modifier.fillMaxWidth().testTag("input_web_client_id")
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.saveCustomWebClientId(webClientIdInput)
                        showWebClientIdDialog = false
                    }
                ) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showWebClientIdDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
private fun SettingsSectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.onBackground
    )
}

@Composable
private fun SettingsActionRow(
    title: String,
    subtitle: String,
    icon: ImageVector,
    onClick: () -> Unit,
    trailingContent: @Composable (() -> Unit)? = null
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(vertical = 10.dp, horizontal = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.weight(1f)
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
            }

            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        if (trailingContent != null) {
            trailingContent()
        }
    }
}
