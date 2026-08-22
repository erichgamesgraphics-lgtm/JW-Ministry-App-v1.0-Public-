package com.example.data.repository

import com.example.data.database.TimerStateDao
import com.example.data.model.TimerStateEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class TimerRepository(
    private val dao: TimerStateDao,
    private val coroutineScope: CoroutineScope
) {
    private val _timerEntity = MutableStateFlow(TimerStateEntity())
    val timerEntity = _timerEntity.asStateFlow()

    init {
        coroutineScope.launch(Dispatchers.IO) {
            dao.getTimerState().collectLatest { entity ->
                _timerEntity.value = entity ?: TimerStateEntity()
            }
        }
    }

    fun calculateCurrentDurationSeconds(): Long {
        val state = _timerEntity.value
        return when {
            state.isRunning && !state.isPaused -> {
                val currentRun = (System.currentTimeMillis() - state.startTimestampMillis) / 1000
                maxOf(0L, state.accumulatedDurationSeconds + currentRun)
            }
            state.isPaused -> {
                state.accumulatedDurationSeconds
            }
            else -> 0L
        }
    }

    suspend fun startTimer() {
        val now = System.currentTimeMillis()
        val newState = TimerStateEntity(
            id = 1,
            isRunning = true,
            isPaused = false,
            startTimestampMillis = now,
            accumulatedDurationSeconds = 0,
            pausedTimestampMillis = 0
        )
        dao.saveTimerState(newState)
        _timerEntity.value = newState
    }

    suspend fun pauseTimer() {
        val current = _timerEntity.value
        if (current.isRunning && !current.isPaused) {
            val now = System.currentTimeMillis()
            val additionalSec = (now - current.startTimestampMillis) / 1000
            val totalAccum = maxOf(0L, current.accumulatedDurationSeconds + additionalSec)
            val newState = current.copy(
                isPaused = true,
                accumulatedDurationSeconds = totalAccum,
                pausedTimestampMillis = now
            )
            dao.saveTimerState(newState)
            _timerEntity.value = newState
        }
    }

    suspend fun resumeTimer() {
        val current = _timerEntity.value
        if (current.isRunning && current.isPaused) {
            val now = System.currentTimeMillis()
            val newState = current.copy(
                isPaused = false,
                startTimestampMillis = now,
                pausedTimestampMillis = 0
            )
            dao.saveTimerState(newState)
            _timerEntity.value = newState
        }
    }

    suspend fun stopTimer(): Long {
        val duration = calculateCurrentDurationSeconds()
        resetTimer()
        return duration
    }

    suspend fun resetTimer() {
        val resetState = TimerStateEntity(id = 1, isRunning = false, isPaused = false, startTimestampMillis = 0, accumulatedDurationSeconds = 0)
        dao.saveTimerState(resetState)
        _timerEntity.value = resetState
    }
}
