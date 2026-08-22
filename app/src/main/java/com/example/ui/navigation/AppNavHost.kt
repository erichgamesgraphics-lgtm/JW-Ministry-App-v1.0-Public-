package com.example.ui.navigation

import android.app.Activity
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.ui.screens.ActivityScreen
import com.example.ui.screens.AddEditEntryScreen
import com.example.ui.screens.AddEditScheduleScreen
import com.example.ui.screens.CalendarScreen
import com.example.ui.screens.HomeScreen
import com.example.ui.screens.ReportsScreen
import com.example.ui.screens.SettingsScreen
import com.example.ui.screens.WelcomeScreen
import com.example.ui.viewmodel.MinistryViewModel
import kotlinx.coroutines.flow.collectLatest

@Composable
fun AppNavHost(
    viewModel: MinistryViewModel,
    modifier: Modifier = Modifier
) {
    val navController = rememberNavController()
    val snackbarHostState = remember { SnackbarHostState() }
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val context = LocalContext.current
    val activity = context as? Activity
    val isAuthenticating by viewModel.isAuthenticating.collectAsState()
    val isCheckingAuthState by viewModel.isCheckingAuthState.collectAsState()

    // Listen to user feedback messages
    LaunchedEffect(Unit) {
        viewModel.userMessage.collectLatest { msg ->
            snackbarHostState.showSnackbar(msg)
        }
    }

    if (isCheckingAuthState) {
        Surface(
            modifier = modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background
        ) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(88.dp)
                            .clip(RoundedCornerShape(26.dp))
                            .background(MaterialTheme.colorScheme.primaryContainer),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.MenuBook,
                            contentDescription = "Ministry Tracker",
                            tint = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.size(48.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(28.dp))
                    androidx.compose.material3.CircularProgressIndicator(
                        modifier = Modifier.size(28.dp),
                        color = MaterialTheme.colorScheme.primary,
                        strokeWidth = 2.8.dp
                    )
                }
            }
        }
        return
    }

    val bottomNavRoutes = listOf(
        Screen.Home.route,
        Screen.Activity.route,
        Screen.Calendar.route,
        Screen.Reports.route,
        Screen.Settings.route
    )

    val showBottomBar = currentRoute in bottomNavRoutes

    val initialStartDestination = remember {
        if (viewModel.isUserAuthenticatedOrGuest()) Screen.Home.route else Screen.Welcome.route
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            AnimatedVisibility(
                visible = showBottomBar,
                enter = slideInVertically(initialOffsetY = { it }),
                exit = slideOutVertically(targetOffsetY = { it })
            ) {
                MinistryAnimatedBottomBar(
                    currentRoute = currentRoute,
                    onNavigate = { route ->
                        if (currentRoute != route) {
                            navController.navigate(route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    }
                )
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = initialStartDestination,
            modifier = Modifier.padding(innerPadding)
        ) {
            // Welcome Screen
            composable(Screen.Welcome.route) {
                WelcomeScreen(
                    onContinueAsGuest = {
                        viewModel.continueAsGuest {
                            navController.navigate(Screen.Home.route) {
                                popUpTo(Screen.Welcome.route) { inclusive = true }
                            }
                        }
                    },
                    onContinueWithGoogle = {
                        if (activity != null) {
                            viewModel.signInWithGoogle(
                                activity = activity,
                                onSuccess = {
                                    navController.navigate(Screen.Home.route) {
                                        popUpTo(Screen.Welcome.route) { inclusive = true }
                                    }
                                },
                                onError = { /* Feedback shown in snackbar */ }
                            )
                        }
                    },
                    onContinueWithApple = {
                        if (activity != null) {
                            viewModel.signInWithApple(
                                activity = activity,
                                onSuccess = {
                                    navController.navigate(Screen.Home.route) {
                                        popUpTo(Screen.Welcome.route) { inclusive = true }
                                    }
                                },
                                onError = { /* Feedback shown in snackbar */ }
                            )
                        }
                    },
                    isAuthenticating = isAuthenticating
                )
            }

            // Home Screen
            composable(Screen.Home.route) {
                HomeScreen(
                    viewModel = viewModel,
                    onAddEntryClick = {
                        navController.navigate(Screen.AddEditEntry.createRoute(0L, 0))
                    }
                )
            }

            // Activity Screen
            composable(Screen.Activity.route) {
                ActivityScreen(
                    viewModel = viewModel,
                    onEditEntryClick = { entryId ->
                        navController.navigate(Screen.AddEditEntry.createRoute(entryId, 0))
                    },
                    onSaveTimerSessionClick = { durationMinutes ->
                        navController.navigate(Screen.AddEditEntry.createRoute(0L, durationMinutes))
                    },
                    onAddManualEntryClick = {
                        navController.navigate(Screen.AddEditEntry.createRoute(0L, 0))
                    }
                )
            }

            // Calendar Screen
            composable(Screen.Calendar.route) {
                CalendarScreen(
                    viewModel = viewModel,
                    onAddScheduleClick = { selectedDateMillis ->
                        navController.navigate(Screen.AddEditSchedule.createRoute(0L, selectedDateMillis))
                    },
                    onEditScheduleClick = { eventId ->
                        navController.navigate(Screen.AddEditSchedule.createRoute(eventId, 0L))
                    },
                    onEditEntryClick = { entryId ->
                        navController.navigate(Screen.AddEditEntry.createRoute(entryId, 0))
                    },
                    onAddEntryClick = {
                        navController.navigate(Screen.AddEditEntry.createRoute(0L, 0))
                    }
                )
            }

            // Reports Screen
            composable(Screen.Reports.route) {
                ReportsScreen(
                    viewModel = viewModel
                )
            }

            // Settings Screen
            composable(Screen.Settings.route) {
                SettingsScreen(
                    viewModel = viewModel,
                    onNavigateToWelcome = {
                        navController.navigate(Screen.Welcome.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }

            // Add/Edit Ministry Entry Screen
            composable(
                route = Screen.AddEditEntry.route,
                arguments = listOf(
                    navArgument("entryId") {
                        type = NavType.LongType
                        defaultValue = 0L
                    },
                    navArgument("duration") {
                        type = NavType.IntType
                        defaultValue = 0
                    }
                )
            ) { backStackEntry ->
                val entryId = backStackEntry.arguments?.getLong("entryId") ?: 0L
                val duration = backStackEntry.arguments?.getInt("duration") ?: 0
                AddEditEntryScreen(
                    viewModel = viewModel,
                    entryId = entryId,
                    initialDurationMinutes = duration,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            // Add/Edit Scheduled Ministry Screen
            composable(
                route = Screen.AddEditSchedule.route,
                arguments = listOf(
                    navArgument("eventId") {
                        type = NavType.LongType
                        defaultValue = 0L
                    },
                    navArgument("dateMillis") {
                        type = NavType.LongType
                        defaultValue = 0L
                    }
                )
            ) { backStackEntry ->
                val eventId = backStackEntry.arguments?.getLong("eventId") ?: 0L
                val dateMillis = backStackEntry.arguments?.getLong("dateMillis") ?: 0L
                AddEditScheduleScreen(
                    viewModel = viewModel,
                    eventId = eventId,
                    initialDateMillis = if (dateMillis > 0L) dateMillis else null,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
    }
}

/**
 * Animated Bottom Navigation Bar
 * Smooth, subtle Material 3 transitions confined strictly within the bottom bar.
 */
@Composable
private fun MinistryAnimatedBottomBar(
    currentRoute: String?,
    onNavigate: (String) -> Unit
) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 4.dp,
        shadowElevation = 8.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 8.dp, vertical = 6.dp)
                .height(64.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            BottomNavItem.entries.forEach { item ->
                val isSelected = currentRoute == item.screen.route

                // Subtle icon scale transition (1.0 -> 1.12)
                val iconScale by animateFloatAsState(
                    targetValue = if (isSelected) 1.12f else 1.0f,
                    animationSpec = tween(durationMillis = 200, easing = FastOutSlowInEasing),
                    label = "iconScale"
                )

                // Indicator pill background color transition
                val indicatorColor by animateColorAsState(
                    targetValue = if (isSelected) MaterialTheme.colorScheme.primaryContainer else Color.Transparent,
                    animationSpec = tween(durationMillis = 220, easing = FastOutSlowInEasing),
                    label = "indicatorColor"
                )

                // Icon color transition
                val iconColor by animateColorAsState(
                    targetValue = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurfaceVariant,
                    animationSpec = tween(durationMillis = 200, easing = FastOutSlowInEasing),
                    label = "iconColor"
                )

                // Text color transition
                val textColor by animateColorAsState(
                    targetValue = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                    animationSpec = tween(durationMillis = 200, easing = FastOutSlowInEasing),
                    label = "textColor"
                )

                // Indicator width animation for pill effect
                val indicatorWidth by animateDpAsState(
                    targetValue = if (isSelected) 56.dp else 40.dp,
                    animationSpec = tween(durationMillis = 220, easing = FastOutSlowInEasing),
                    label = "indicatorWidth"
                )

                val interactionSource = remember { MutableInteractionSource() }

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(16.dp))
                        .clickable(
                            interactionSource = interactionSource,
                            indication = null
                        ) {
                            onNavigate(item.screen.route)
                        }
                        .padding(vertical = 4.dp)
                        .testTag("nav_tab_${item.name.lowercase()}")
                ) {
                    Box(
                        modifier = Modifier
                            .size(width = indicatorWidth, height = 30.dp)
                            .clip(RoundedCornerShape(15.dp))
                            .background(indicatorColor),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (isSelected) item.selectedIcon else item.unselectedIcon,
                            contentDescription = item.title,
                            tint = iconColor,
                            modifier = Modifier
                                .size(22.dp)
                                .scale(iconScale)
                        )
                    }

                    Spacer(modifier = Modifier.height(3.dp))

                    Text(
                        text = item.title,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                        ),
                        color = textColor,
                        maxLines = 1
                    )
                }
            }
        }
    }
}

