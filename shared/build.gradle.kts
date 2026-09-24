plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.kotlinSerialization)
    alias(libs.plugins.androidLibrary)
}

kotlin {
    // JVM target exists purely so the analysis logic can be tested in
    // milliseconds without an emulator or a device.
    jvm()

    androidTarget()

    // An iOS target compiles the same source once a Mac is available. It is
    // left out here because Kotlin/Native cannot build iOS binaries on Windows,
    // and a target that cannot compile would break every local build.

    sourceSets {
        commonMain.dependencies {
            implementation(libs.kotlinx.serialization.json)
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
        }
    }
}

android {
    namespace = "com.appautopsy.shared"
    compileSdk = 35

    defaultConfig {
        minSdk = 24
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}