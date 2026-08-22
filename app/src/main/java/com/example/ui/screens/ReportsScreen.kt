package com.example.ui.screens

import android.content.Intent
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
import androidx.compose.material.icons.filled.AutoStories
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.components.MinistryStatCard
import com.example.ui.components.SimpleBarChart
import com.example.ui.viewmodel.MinistryViewModel
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

@Composable
fun ReportsScreen(
    viewModel: MinistryViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var selectedTabIndex by remember { mutableIntStateOf(0) } // 0 = Month, 1 = Year, 2 = All Time

    val allEntries by viewModel.allEntries.collectAsState()
    val settings by viewModel.userSettings.collectAsState()
    val stats by viewModel.dashboardStats.collectAsState()

    val reportsData = remember(selectedTabIndex, allEntries) {
        viewModel.getReportsForPeriod(selectedTabIndex, allEntries)
    }

    val tabTitles = remember { listOf("Month", "Year", "All Time") }
    val currentMonthName = remember { SimpleDateFormat("MMMM yyyy", Locale.getDefault()).format(Date()) }
    val currentYear = remember { Calendar.getInstance().get(Calendar.YEAR) }

    fun formatMinutes(minutes: Int): String {
        val h = minutes / 60
        val m = minutes % 60
        return if (h > 0) "${h}h ${m}m" else "${m}m"
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 18.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Reports",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(
                        text = when (selectedTabIndex) {
                            0 -> currentMonthName
                            1 -> "$currentYear Service Year"
                            else -> "Cumulative Ministry"
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // Share Monthly Report Summary button
                OutlinedButton(
                    onClick = {
                        coroutineScope.launch {
                            val cal = Calendar.getInstance()
                            val summary = viewModel.authAndSyncRepo.generateReportSummary(
                                cal.get(Calendar.YEAR),
                                cal.get(Calendar.MONTH)
                            )
                            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(Intent.EXTRA_SUBJECT, "Ministry Report - $currentMonthName")
                                putExtra(Intent.EXTRA_TEXT, summary)
                            }
                            context.startActivity(Intent.createChooser(shareIntent, "Share Ministry Report"))
                        }
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.testTag("reports_share_button")
                ) {
                    Icon(imageVector = Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Share", style = MaterialTheme.typography.labelMedium)
                }
            }
        }

        // Tabs: Month, Year, All Time
        item {
            TabRow(
                selectedTabIndex = selectedTabIndex,
                modifier = Modifier
                    .clip(RoundedCornerShape(14.dp))
                    .testTag("reports_tab_row"),
                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            ) {
                tabTitles.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTabIndex == index,
                        onClick = { selectedTabIndex = index },
                        text = {
                            Text(
                                text = title,
                                fontWeight = if (selectedTabIndex == index) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    )
                }
            }
        }

        // Monthly Goal Progress Card (for Month Tab)
        if (selectedTabIndex == 0 && stats.goalHours > 0) {
            item {
                ElevatedCard(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "${settings.publisherStatus.displayName} Goal",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "${formatMinutes(reportsData.totalMinutes)} / ${stats.goalHours}h (${(stats.goalProgressPercentage * 100).toInt()}%)",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        LinearProgressIndicator(
                            progress = { stats.goalProgressPercentage },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp)),
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }

        // Report Statistics Grid
        item {
            Text(
                text = "Summary Statistics",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                MinistryStatCard(
                    title = "Total Hours",
                    value = formatMinutes(reportsData.totalMinutes),
                    subtitle = "${String.format(Locale.getDefault(), "%.1f", reportsData.totalMinutes / 60.0)} decimal hrs",
                    icon = Icons.Default.Schedule,
                    modifier = Modifier.weight(1f).testTag("report_stat_hours"),
                    accentColor = MaterialTheme.colorScheme.primary
                )
                MinistryStatCard(
                    title = "Days Active",
                    value = "${reportsData.activeDays}",
                    subtitle = "days in period",
                    icon = Icons.Default.CalendarToday,
                    modifier = Modifier.weight(1f).testTag("report_stat_active_days"),
                    accentColor = Color(0xFF0284C7)
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                MinistryStatCard(
                    title = "Return Visits",
                    value = "${reportsData.totalReturnVisits}",
                    subtitle = "total recorded",
                    icon = Icons.Default.People,
                    modifier = Modifier.weight(1f).testTag("report_stat_rv"),
                    accentColor = Color(0xFF0D9488)
                )
                MinistryStatCard(
                    title = "Bible Studies",
                    value = "${reportsData.totalBibleStudies}",
                    subtitle = "total recorded",
                    icon = Icons.Default.AutoStories,
                    modifier = Modifier.weight(1f).testTag("report_stat_bs"),
                    accentColor = Color(0xFF7C3AED)
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                MinistryStatCard(
                    title = "Placements",
                    value = "${reportsData.totalPlacements}",
                    subtitle = "books & magazines",
                    icon = Icons.Default.DateRange,
                    modifier = Modifier.weight(1f).testTag("report_stat_placements"),
                    accentColor = Color(0xFFC07000)
                )
                MinistryStatCard(
                    title = "Ministry Streak",
                    value = "${reportsData.streakMonths}m",
                    subtitle = "consecutive months",
                    icon = Icons.Default.LocalFireDepartment,
                    modifier = Modifier.weight(1f).testTag("report_stat_streak"),
                    accentColor = Color(0xFFEA580C)
                )
            }
        }

        // Charts Section
        item {
            Text(
                text = "Visual Analytics",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        // Monthly Hours Bar Chart
        item {
            ElevatedCard(
                modifier = Modifier.fillMaxWidth().testTag("report_monthly_chart_card"),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = "Monthly Hours (Last 6 Months)",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(14.dp))
                    SimpleBarChart(
                        data = reportsData.monthlyHoursBreakdown,
                        barColor = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }

        // Weekly Activity Chart (Month Tab)
        if (selectedTabIndex == 0) {
            item {
                ElevatedCard(
                    modifier = Modifier.fillMaxWidth().testTag("report_weekly_chart_card"),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Text(
                            text = "Weekly Activity (Current Month)",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(14.dp))
                        SimpleBarChart(
                            data = reportsData.weeklyHoursBreakdown,
                            barColor = Color(0xFF0284C7)
                        )
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
