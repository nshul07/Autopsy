pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "AppAutopsy"

// :shared holds every piece of analysis logic and imports nothing from Android,
// so it compiles for the JVM (fast unit tests, no emulator) and can gain iOS
// targets later without changing a line of analysis code.
include(":shared")
include(":androidApp")