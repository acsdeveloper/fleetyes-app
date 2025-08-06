# fleetyes
This is written in react native

## Building Android APK

### Install Dependencies
Run this in the project root:

npm install --legacy-peer-deps


### 1. Build Debug APK
Run:

cd android && ./gradlew assembleDebug

APK will be at:

android/app/build/outputs/apk/debug/app-debug.apk


### 2. Build Release APK
Run:

cd android && ./gradlew assembleRelease

APK will be at:

android/app/build/outputs/apk/release/app-release.apk

