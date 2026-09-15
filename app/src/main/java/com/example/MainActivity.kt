package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.example.ui.navigation.AppNavHost
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.viewmodel.MinistryViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: MinistryViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val userSettings by viewModel.userSettings.collectAsState()
            val systemDark = isSystemInDarkTheme()

            val isDark = when (userSettings.themeMode) {
                "DARK" -> true
                "LIGHT" -> false
                else -> systemDark
            }

            MyApplicationTheme(darkTheme = isDark) {
                AppNavHost(viewModel = viewModel)
            }
        }
    }
}
