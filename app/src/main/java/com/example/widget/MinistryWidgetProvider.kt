package com.example.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.RemoteViews
import com.example.MainActivity
import com.example.R
import com.example.data.database.AppDatabase
import com.example.data.model.PublisherStatus
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import kotlin.math.max
import kotlin.math.min

open class MinistryWidgetProvider(private val layoutResId: Int) : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                for (appWidgetId in appWidgetIds) {
                    updateSingleWidget(context, appWidgetManager, appWidgetId, layoutResId)
                }
            } finally {
                pendingResult.finish()
            }
        }
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle?
    ) {
        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                updateSingleWidget(context, appWidgetManager, appWidgetId, layoutResId)
            } finally {
                pendingResult.finish()
            }
        }
    }

    companion object {
        const val ACTION_OPEN_MINISTRY_AI = "com.example.ACTION_OPEN_MINISTRY_AI"
        const val EXTRA_NAVIGATE_TO = "EXTRA_NAVIGATE_TO"
        const val DESTINATION_MINISTRY_AI = "MINISTRY_AI"

        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)

            val providers = listOf(
                MinistrySmallWidgetProvider::class.java,
                MinistryMediumWidgetProvider::class.java,
                MinistryLargeWidgetProvider::class.java
            )

            for (provider in providers) {
                val component = ComponentName(context, provider)
                val ids = appWidgetManager.getAppWidgetIds(component)
                if (ids.isNotEmpty()) {
                    val intent = Intent(context, provider).apply {
                        action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                        putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
                    }
                    context.sendBroadcast(intent)
                }
            }
        }

        suspend fun updateSingleWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int,
            layoutResId: Int
        ) {
            val db = AppDatabase.getDatabase(context)
            val entryDao = db.ministryEntryDao()
            val settingsDao = db.userSettingsDao()

            val cal = Calendar.getInstance()
            val year = cal.get(Calendar.YEAR)
            val month = cal.get(Calendar.MONTH)

            // Start of month
            cal.set(Calendar.DAY_OF_MONTH, 1)
            cal.set(Calendar.HOUR_OF_DAY, 0)
            cal.set(Calendar.MINUTE, 0)
            cal.set(Calendar.SECOND, 0)
            cal.set(Calendar.MILLISECOND, 0)
            val startMillis = cal.timeInMillis

            // End of month
            cal.add(Calendar.MONTH, 1)
            val endMillis = cal.timeInMillis - 1

            val entries = entryDao.getAllEntriesList().filter {
                it.dateMillis in startMillis..endMillis
            }

            val totalMinutes = entries.sumOf { it.durationMinutes }
            val returnVisits = entries.sumOf { it.returnVisits }
            val bibleStudies = entries.sumOf { it.bibleStudies }
            val placements = entries.sumOf { it.placements }

            val userSettings = settingsDao.getSettingsDirect()
            val publisherStatus = userSettings?.publisherStatus ?: PublisherStatus.PUBLISHER
            val customGoal = userSettings?.customGoalHours ?: 50

            val goalHours = when (publisherStatus) {
                PublisherStatus.PUBLISHER -> 0
                PublisherStatus.AUXILIARY_PIONEER_15 -> 15
                PublisherStatus.AUXILIARY_PIONEER_30 -> 30
                PublisherStatus.REGULAR_PIONEER_50 -> 50
                PublisherStatus.SPECIAL_PIONEER_100 -> 100
                PublisherStatus.CUSTOM -> customGoal
            }

            val currentHours = totalMinutes / 60.0
            val effectiveGoal = if (goalHours > 0) goalHours else 10
            val remainingHours = max(0.0, effectiveGoal - currentHours)
            val progressPercent = min(100, ((currentHours / effectiveGoal) * 100).toInt())

            val monthName = SimpleDateFormat("MMMM", Locale.getDefault()).format(Date())

            val views = RemoteViews(context.packageName, layoutResId)

            // Hours & Goal formatting
            val hoursGoalText = if (goalHours > 0) {
                String.format(Locale.getDefault(), "%.1f / %d h", currentHours, goalHours)
            } else {
                String.format(Locale.getDefault(), "%.1f h", currentHours)
            }

            val remainingText = if (remainingHours > 0) {
                String.format(Locale.getDefault(), "%.1f h remaining", remainingHours)
            } else {
                "Goal reached! 🎉"
            }

            views.setTextViewText(R.id.tv_hours_goal, hoursGoalText)
            views.setProgressBar(R.id.progress_bar, 100, progressPercent, false)
            views.setTextViewText(R.id.tv_remaining, remainingText)

            if (layoutResId == R.layout.widget_medium || layoutResId == R.layout.widget_large) {
                views.setTextViewText(R.id.tv_month_name, monthName)
            }

            if (layoutResId == R.layout.widget_large) {
                views.setTextViewText(R.id.tv_rv_count, returnVisits.toString())
                views.setTextViewText(R.id.tv_bs_count, bibleStudies.toString())
                views.setTextViewText(R.id.tv_placements_count, placements.toString())
            }

            // Pending intent for clicking Ask AI button or widget background -> opens Ministry AI directly
            val aiIntent = Intent(context, MainActivity::class.java).apply {
                action = ACTION_OPEN_MINISTRY_AI
                putExtra(EXTRA_NAVIGATE_TO, DESTINATION_MINISTRY_AI)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }

            val aiPendingIntent = PendingIntent.getActivity(
                context,
                appWidgetId,
                aiIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            views.setOnClickPendingIntent(R.id.btn_ask_ai, aiPendingIntent)
            views.setOnClickPendingIntent(R.id.widget_root, aiPendingIntent)

            withContext(Dispatchers.Main) {
                appWidgetManager.updateAppWidget(appWidgetId, views)
            }
        }
    }
}

class MinistrySmallWidgetProvider : MinistryWidgetProvider(R.layout.widget_small)
class MinistryMediumWidgetProvider : MinistryWidgetProvider(R.layout.widget_medium)
class MinistryLargeWidgetProvider : MinistryWidgetProvider(R.layout.widget_large)
