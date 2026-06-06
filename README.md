# FlowOS – Your Personal Life OS

A complete personal management app with:
- 📊 **Dashboard** – Daily energy, tasks, project overview 
- 📁 **Projects** – Full project management with budgets & tasks
- 🔥 **Habits** – Duolingo-style habit tracking with XP & streaks
- 🔒 **App Limits** – Daily screen time limits that block apps at midnight
- 🏆 **Vision** – Goals linked to projects

---

## Build APK in 5 Steps

### Step 1 – Install Node.js
Download from https://nodejs.org (LTS version)

### Step 2 – Install Expo & EAS CLI
Open terminal and run:
```
npm install -g expo-cli eas-cli
```

### Step 3 – Install dependencies
Navigate into the FlowOS folder, then run:
```
npm install
```

### Step 4 – Create free Expo account
Go to https://expo.dev → Sign Up (free)

Then login in terminal:
```
eas login
```

### Step 5 – Build the APK
```
eas build --platform android --profile preview
```

This uploads to Expo's cloud servers and builds the APK.
When done (~5–10 min), you get a **download link** for your APK.

---

## Install on Android

1. Download the APK from the link Expo gives you
2. Open the APK on your phone
3. If prompted: Settings → Security → Allow unknown sources
4. Install → Done ✅

---

## Project Structure

```
FlowOS/
├── App.js                          # Entry point
├── app.json                        # Expo config
├── eas.json                        # Build config
├── package.json                    # Dependencies
└── src/
    ├── theme/index.js              # Colors, typography, spacing
    ├── data/initialData.js         # Sample data
    ├── components/UI.js            # Reusable components
    ├── navigation/AppNavigator.js  # Tab navigation
    └── screens/
        ├── DashboardScreen.js      # Home screen
        ├── ProjectsScreen.js       # Project manager
        ├── HabitsScreen.js         # Habit tracker
        ├── AppLimitsScreen.js      # App time limits
        └── GoalsScreen.js          # Annual goals
```

---

## Features

### Habits (Duolingo-style)
- Built-in templates: Duolingo, Instagram Post, LinkedIn, Workout, Journaling, Meditation...
- XP system with streaks
- Verification per habit type:
  - **Timer** – starts a stopwatch, complete after X seconds
  - **Link** – paste your post URL
  - **Text** – write your journal entry
  - **Checkbox** – simple tap to confirm
- Weekly log dots per habit
- Celebration animation on completion

### App Limits
- Set daily time limits per app (Instagram, TikTok, YouTube, etc.)
- Visual progress bar turns red when nearing limit
- Apps marked as **BLOCKED** once limit is reached
- Unlocks at midnight
- Filter by category: All / Social / Entertainment

### Projects
- Expandable cards with task lists
- Budget tracking (used vs. total)
- Status: On Track / At Risk / Blocked
- Energy levels per task (High / Medium / Low)
- Linked to annual goals

---

Built with React Native + Expo 🚀
