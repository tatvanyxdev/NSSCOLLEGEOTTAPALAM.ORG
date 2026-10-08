# NSS College Ottapalam - Android App Setup Guide (Capacitor & Android Studio)

This project has been pre-configured and synchronized with **Capacitor Android**.

---

## 🚀 Quick Start in Android Studio

### Step 1: Extract the Exported ZIP
Unzip the downloaded project folder to your local machine (e.g. `~/Projects/nss-college-app`).

### Step 2: Open in Android Studio
1. Launch **Android Studio**.
2. Click **Open** (or `File > Open...`).
3. Select the **`android`** folder located inside this project (e.g., `nss-college-app/android`).
4. Wait for Android Studio to finish Gradle sync and build indexing (typically 1–2 minutes on first launch).

### Step 3: Run the App
- Connect an Android device (with USB debugging enabled) or start an Android Virtual Device (AVD Emulator).
- Click the green **Run (▶)** button in Android Studio.

---

## 🛠 Project Customization & Commands

If you make any web changes in `src/` and want to update the Android app:

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Rebuild web assets and synchronize with Android Studio
npm run cap:build

# 3. Open directly in Android Studio
npm run cap:open
```

---

## 📱 Features Pre-configured for Android

1. **Hardware Back Button**:
   - Automatically closes open dialogs, bottom sheets, search overlays, and navigation drawers.
   - Smoothly returns to Dashboard from inner tabs.
   - Double-tap back on Home screen prompts to exit cleanly.

2. **Edge-to-Edge & Safe-Area Insets**:
   - `viewport-fit=cover` enabled in `index.html`.
   - Android status bar and navigation bar padding handled automatically.
   - Status bar dynamically harmonizes with Dark/Light mode theme switches.

3. **Android Permissions & Cleartext Traffic**:
   - `INTERNET` and `ACCESS_NETWORK_STATE` enabled in `AndroidManifest.xml`.
   - `usesCleartextTraffic="true"` enabled for reliable API calls.
   - File/Media permissions configured for downloading attendance logs, timetable exports, and academic circulars.
   - Virtual keyboard adjustment (`adjustResize`) configured to prevent input clipping.

4. **Package Details**:
   - **App Name**: NSS College Ottapalam
   - **Application ID**: `org.nsscollegeottapalam.erp`
   - **Target SDK**: Android 14 / 15 (API 34/35 compatible)
