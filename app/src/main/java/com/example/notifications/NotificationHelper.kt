package com.example.notifications

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.example.MainActivity
import com.example.R
import java.util.Calendar

class ReminderNotificationReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val title = intent.getStringExtra("title") ?: "Ministry Reminder"
        val message = intent.getStringExtra("message") ?: "Time for your scheduled ministry activity."
        val notificationId = intent.getIntExtra("notificationId", (System.currentTimeMillis() % 10000).toInt())

        NotificationHelper.showNotification(context, notificationId, title, message)
    }
}

object NotificationHelper {
    const val CHANNEL_ID_MINISTRY = "ministry_reminders"
    const val CHANNEL_ID_DAILY = "daily_reminders"
    const val CHANNEL_ID_REPORTS = "report_reminders"

    fun createNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val ministryChannel = NotificationChannel(
                CHANNEL_ID_MINISTRY,
                "Ministry & Event Reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Reminders for scheduled ministry sessions and preaching arrangements"
                enableVibration(true)
            }

            val dailyChannel = NotificationChannel(
                CHANNEL_ID_DAILY,
                "Daily Ministry Reminders",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Daily reminders to record activity and review daily scripture"
            }

            val reportChannel = NotificationChannel(
                CHANNEL_ID_REPORTS,
                "Monthly Report Reminders",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "End of month ministry report reminders"
            }

            notificationManager.createNotificationChannel(ministryChannel)
            notificationManager.createNotificationChannel(dailyChannel)
            notificationManager.createNotificationChannel(reportChannel)
        }
    }

    fun showNotification(context: Context, id: Int, title: String, message: String, channelId: String = CHANNEL_ID_MINISTRY) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                return
            }
        }

        val tapIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            id,
            tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)

        with(NotificationManagerCompat.from(context)) {
            notify(id, builder.build())
        }
    }

    fun scheduleEventReminder(
        context: Context,
        eventId: Long,
        title: String,
        startTimeMillis: Long,
        minutesBefore: Int,
        location: String
    ) {
        val triggerTime = startTimeMillis - (minutesBefore * 60 * 1000L)
        if (triggerTime <= System.currentTimeMillis()) return

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, ReminderNotificationReceiver::class.java).apply {
            putExtra("title", "Upcoming Ministry: $title")
            val locText = if (location.isNotBlank()) " at $location" else ""
            putExtra("message", "Your ministry session is scheduled for ${minutesBefore} minutes from now$locText.")
            putExtra("notificationId", eventId.toInt())
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            eventId.toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
            }
        } catch (e: SecurityException) {
            alarmManager.set(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
        }
    }

    fun cancelEventReminder(context: Context, eventId: Long) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, ReminderNotificationReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            eventId.toInt(),
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()
        }
    }
}
