package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.isSystemInDarkTheme
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
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R

/**
 * Welcome / Authentication Screen for Ministry Tracker.
 * Clean, modern, uncluttered design showcasing the app's core purpose
 * and providing authentic Google and Apple authentication flows.
 */
@Composable
fun WelcomeScreen(
    onContinueWithGoogle: () -> Unit,
    onContinueWithApple: () -> Unit,
    onContinueAsGuest: () -> Unit = {},
    isAuthenticating: Boolean = false
) {
    val isDark = isSystemInDarkTheme()

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 28.dp, vertical = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            // 1. Header & Ministry Illustration Section
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                // Elegant Ministry Icon Emblem
                Box(
                    modifier = Modifier
                        .size(104.dp)
                        .clip(RoundedCornerShape(30.dp))
                        .background(MaterialTheme.colorScheme.primaryContainer)
                        .shadow(elevation = 8.dp, shape = RoundedCornerShape(30.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.MenuBook,
                        contentDescription = "Ministry Tracker Logo",
                        tint = MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.size(54.dp)
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                // App Title
                Text(
                    text = "Ministry Tracker",
                    style = MaterialTheme.typography.headlineLarge.copy(
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = (-0.5).sp
                    ),
                    color = MaterialTheme.colorScheme.onBackground,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Description
                Text(
                    text = "Track your ministry, schedule your service, and keep your spiritual activity organized.",
                    style = MaterialTheme.typography.bodyLarge.copy(
                        lineHeight = 22.sp
                    ),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 8.dp)
                )
            }

            Spacer(modifier = Modifier.height(36.dp))

            // 2. Sign-In Section
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Welcome",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold
                    ),
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "Sign in to securely save and synchronize your ministry activity.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 12.dp)
                )

                Spacer(modifier = Modifier.height(24.dp))

                // --- Google Authentication Button ---
                Button(
                    onClick = onContinueWithGoogle,
                    enabled = !isAuthenticating,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp)
                        .testTag("welcome_google_button"),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isDark) Color(0xFF1E293B) else Color.White,
                        contentColor = if (isDark) Color.White else Color(0xFF1F2937),
                        disabledContainerColor = if (isDark) Color(0xFF1E293B).copy(alpha = 0.6f) else Color(0xFFF3F4F6)
                    ),
                    elevation = ButtonDefaults.buttonElevation(
                        defaultElevation = 2.dp,
                        pressedElevation = 4.dp
                    ),
                    border = androidx.compose.foundation.BorderStroke(
                        width = 1.dp,
                        color = if (isDark) Color(0xFF334155) else Color(0xFFE5E7EB)
                    )
                ) {
                    if (isAuthenticating) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(22.dp),
                            color = MaterialTheme.colorScheme.primary,
                            strokeWidth = 2.5.dp
                        )
                    } else {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_google_logo),
                                contentDescription = "Google Logo",
                                modifier = Modifier.size(22.dp),
                                tint = Color.Unspecified
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = "Continue with Google",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // --- Apple Authentication Button ---
                Button(
                    onClick = onContinueWithApple,
                    enabled = !isAuthenticating,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp)
                        .testTag("welcome_apple_button"),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isDark) Color.White else Color(0xFF0F172A),
                        contentColor = if (isDark) Color.Black else Color.White,
                        disabledContainerColor = if (isDark) Color.White.copy(alpha = 0.6f) else Color(0xFF0F172A).copy(alpha = 0.6f)
                    ),
                    elevation = ButtonDefaults.buttonElevation(
                        defaultElevation = 2.dp,
                        pressedElevation = 4.dp
                    )
                ) {
                    if (isAuthenticating) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(22.dp),
                            color = if (isDark) Color.Black else Color.White,
                            strokeWidth = 2.5.dp
                        )
                    } else {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_apple_logo),
                                contentDescription = "Apple Logo",
                                modifier = Modifier.size(22.dp),
                                tint = if (isDark) Color.Black else Color.White
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = "Continue with Apple",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Offline / Guest Option
                TextButton(
                    onClick = onContinueAsGuest,
                    enabled = !isAuthenticating,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("welcome_guest_button")
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "Continue without an account",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.Medium
                            ),
                            color = MaterialTheme.colorScheme.primary
                        )
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}
