# Optimization & Obfuscation rules
-keepattributes SourceFile,LineNumberTable

# Room DB Keep Rules
-keep class androidx.room.** { *; }
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class * { *; }
-keep @androidx.room.Dao class * { *; }

# Model classes
-keep class com.example.data.model.** { *; }

# Firebase & Credential Manager
-keep class com.google.firebase.** { *; }
-keep class androidx.credentials.** { *; }

