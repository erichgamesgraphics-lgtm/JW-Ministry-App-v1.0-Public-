package com.example.notifications

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.example.MainActivity
import com.example.R
import com.example.MinistryApp
import kotlinx.coroutines.*
import java.util.Locale

class MinistryTimerService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var tickerJob: Job? = null

    companion object {
        const val CHANNEL_ID_TIMER = "ministry_timer_channel"
        const val NOTIFICATION_ID = 9999

        const val ACTION_START = "com.example.action.START_TIMER"
        const val ACTION_PAUSE = "com.example.action.PAUSE_TIMER"
        const val ACTION_RESUME = "com.example.action.RESUME_TIMER"
        const val ACTION_STOP = "com.example.action.STOP_TIMER"

        fun startService(context: Context) {
            val intent = Intent(context, MinistryTimerService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun pauseService(context: Context) {
            val intent = Intent(context, MinistryTimerService::class.java).apply {
                action = ACTION_PAUSE
            }
            context.startService(intent)
        }

        fun resumeService(context: Context) {
            val intent = Intent(context, MinistryTimerService::class.java).apply {
                action = ACTION_RESUME
            }
            context.startService(intent)
        }

        fun stopService(context: Context) {
            val intent = Intent(context, MinistryTimerService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        val app = application as? MinistryApp
        val timerRepo = app?.timerRepository

        serviceScope.launch {
            when (action) {
                ACTION_PAUSE -> {
                    timerRepo?.pauseTimer()
                }
                ACTION_RESUME -> {
                    timerRepo?.resumeTimer()
                }
                ACTION_STOP -> {
                    timerRepo?.stopTimer()
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    stopSelf()
                    return@launch
                }
                else -> {
                    // Start or update
                }
            }
        }

        startTimerForegroundLoop()

        return START_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID_TIMER,
                "Ministry Timer & HyperIsland",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Ongoing notification for active ministry timer with Xiaomi HyperIsland support"
                setShowBadge(true)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun startTimerForegroundLoop() {
        tickerJob?.cancel()
        val app = application as? MinistryApp
        val timerRepo = app?.timerRepository ?: return

        tickerJob = serviceScope.launch {
            while (isActive) {
                val state = timerRepo.timerEntity.value
                val seconds = timerRepo.calculateCurrentDurationSeconds()

                if (!state.isRunning) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    stopSelf()
                    break
                }

                val notification = buildTimerNotification(seconds, state.isPaused)
                val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                manager.notify(NOTIFICATION_ID, notification)

                delay(1000)
            }
        }

        val state = timerRepo.timerEntity.value
        val seconds = timerRepo.calculateCurrentDurationSeconds()
        val initialNotification = buildTimerNotification(seconds, state.isPaused)
        startForeground(NOTIFICATION_ID, initialNotification)
    }

    private fun buildTimerNotification(seconds: Long, isPaused: Boolean): Notification {
        val hours = seconds / 3600
        val minutes = (seconds % 3600) / 60
        val secs = seconds % 60
        val timeFormatted = String.format(Locale.getDefault(), "%02d:%02d:%02d", hours, minutes, secs)
        val statusText = if (isPaused) "Paused" else "Running"

        val tapIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingTapIntent = PendingIntent.getActivity(
            this, 0, tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val toggleActionIntent = Intent(this, MinistryTimerService::class.java).apply {
            action = if (isPaused) ACTION_RESUME else ACTION_PAUSE
        }
        val pendingToggleIntent = PendingIntent.getService(
            this, 1, toggleActionIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val toggleAction = NotificationCompat.Action.Builder(
            if (isPaused) android.R.drawable.ic_media_play else android.R.drawable.ic_media_pause,
            if (isPaused) "Resume" else "Pause",
            pendingToggleIntent
        ).build()

        val stopActionIntent = Intent(this, MinistryTimerService::class.java).apply {
            action = ACTION_STOP
        }
        val pendingStopIntent = PendingIntent.getService(
            this, 2, stopActionIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val stopAction = NotificationCompat.Action.Builder(
            android.R.drawable.ic_menu_close_clear_cancel,
            "Stop",
            pendingStopIntent
        ).build()

        val builder = NotificationCompat.Builder(this, CHANNEL_ID_TIMER)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Ministry Timer ($statusText)")
            .setContentText("Elapsed: $timeFormatted")
            .setContentIntent(pendingTapIntent)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .addAction(toggleAction)
            .addAction(stopAction)

        val hyperIslandParam = """
            {
              "param_v2": {
                "protocol": 1,
                "business": "stopwatch",
                "enableFloat": true,
                "updatable": true,
                "islandFirstFloat": true,
                "ticker": "Ministry Timer: $timeFormatted ($statusText)",
                "aodTitle": "Ministry Timer Active",
                "param_island": {
                  "islandProperty": 1,
                  "bigIslandArea": {
                    "imageTextInfoLeft": {
                      "type": 1,
                      "title": "Ministry Timer",
                      "content": "$timeFormatted ($statusText)"
                    }
                  }
                }
              }
            }
        """.trimIndent()

        builder.extras.putString("miui.focus.param", hyperIslandParam)

        return builder.build()
    }

    override fun onDestroy() {
        tickerJob?.cancel()
        serviceScope.cancel()
        super.onDestroy()
    }
}
