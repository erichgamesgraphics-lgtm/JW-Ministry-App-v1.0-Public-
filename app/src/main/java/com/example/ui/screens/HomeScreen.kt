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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AutoStories
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.PublisherStatus
import com.example.ui.components.MinistryStatCard
import com.example.ui.components.ScriptureCard
import com.example.ui.viewmodel.MinistryViewModel
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

@Composable
fun HomeScreen(
    viewModel: MinistryViewModel,
    onAddEntryClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val stats by viewModel.dashboardStats.collectAsState()
    val settings by viewModel.userSettings.collectAsState()
    val scripture by viewModel.dailyScripture.collectAsState()

    // Determine Greeting
    val currentHour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    val greeting = when {
        currentHour in 5..11 -> "Good morning"
        currentHour in 12..16 -> "Good afternoon"
        else -> "Good evening"
    }

    val currentMonthName = SimpleDateFormat("MMMM", Locale.getDefault()).format(Date())

    // Formatted time strings
    fun formatMinutes(minutes: Int): String {
        val h = minutes / 60
        val m = minutes % 60
        return if (h > 0) "${h}h ${m}m" else "${m}m"
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(4.dp))
            // Greeting & App Title
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = greeting,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = "JW Ministry App",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                }

                // Publisher Status Badge
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.primaryContainer
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = settings.publisherStatus.displayName,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
            }
        }

        // Goal Progress Card (if Pioneer or Goal is set)
        if (stats.goalHours > 0) {
            item {
                ElevatedCard(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.elevatedCardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    elevation = CardDefaults.elevatedCardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Monthly Goal Progress",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "${(stats.goalProgressPercentage * 100).toInt()}%",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        LinearProgressIndicator(
                            progress = { stats.goalProgressPercentage },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp)),
                            color = MaterialTheme.colorScheme.primary,
                            trackColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "${formatMinutes(stats.monthMinutes)} / ${stats.goalHours}h",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = if (stats.remainingGoalMinutes > 0) "${formatMinutes(stats.remainingGoalMinutes)} remaining" else "Goal reached! 🎉",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Medium,
                                color = if (stats.remainingGoalMinutes > 0) MaterialTheme.colorScheme.primary else Color(0xFF16A34A)
                            )
                        }
                    }
                }
            }
        }

        // Primary Action: + Add Ministry Entry Button
        item {
            Button(
                onClick = onAddEntryClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(46.dp)
                    .testTag("home_add_entry_button"),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                ),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 1.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Add Ministry Entry",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Today's & Monthly Statistics Section
        item {
            Text(
                text = "Ministry Statistics",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        // Grid 1: Today Hours & Month Total
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                MinistryStatCard(
                    title = "Today",
                    value = formatMinutes(stats.todayMinutes),
                    subtitle = "today",
                    icon = Icons.Default.Schedule,
                    modifier = Modifier.weight(1f).testTag("stat_card_today_hours"),
                    accentColor = MaterialTheme.colorScheme.primary
                )
                MinistryStatCard(
                    title = "Month Total",
                    value = formatMinutes(stats.monthMinutes),
                    subtitle = currentMonthName,
                    icon = Icons.Default.DateRange,
                    modifier = Modifier.weight(1f).testTag("stat_card_month_hours"),
                    accentColor = Color(0xFF0284C7)
                )
            }
        }

        // Grid 2: Return Visits & Bible Studies Today
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                MinistryStatCard(
                    title = "Return Visits",
                    value = "${stats.todayReturnVisits}",
                    subtitle = "today (${stats.monthReturnVisits} this month)",
                    icon = Icons.Default.People,
                    modifier = Modifier.weight(1f).testTag("stat_card_today_rv"),
                    accentColor = Color(0xFF0D9488)
                )
                MinistryStatCard(
                    title = "Bible Studies",
                    value = "${stats.todayBibleStudies}",
                    subtitle = "today (${stats.monthBibleStudies} this month)",
                    icon = Icons.Default.AutoStories,
                    modifier = Modifier.weight(1f).testTag("stat_card_today_bs"),
                    accentColor = Color(0xFF7C3AED)
                )
            }
        }

        // Grid 3: Ministry Streak
        item {
            MinistryStatCard(
                title = "Ministry Streak",
                value = "${stats.streakMonths} ${if (stats.streakMonths == 1) "Month" else "Months"}",
                subtitle = "Active consecutive months",
                icon = Icons.Default.LocalFireDepartment,
                modifier = Modifier.fillMaxWidth().testTag("stat_card_streak"),
                accentColor = Color(0xFFEA580C)
            )
        }

        // Daily Scripture Card
        item {
            ScriptureCard(
                scripture = scripture,
                modifier = Modifier.testTag("home_scripture_card")
            )
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
