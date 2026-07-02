# Restaurant Rewards App (scaffold)

A React Native (Expo + TypeScript) starter for a Southeast-Asia-first restaurant
discovery + rewards app. QRIS is the primary payment gateway; card/bank linking is
supported. This is a **scaffold to open in an agentic coding tool** (Claude Code,
Cursor) and build out screen by screen — it has not been run/tested in a simulator.

## Run it
```bash
npm install
# if versions conflict on install:
npx expo install --fix
npm start        # then press i (iOS), a (Android), or w (web)
```
Requires Node 18+ and the Expo tooling. iOS simulator needs Xcode (macOS); Android
needs Android Studio. Easiest: install **Expo Go** on your phone and scan the QR.

## How this maps to the prompt
- `CLAUDE.md` — the persistent project instructions (the "System Prompt"). Claude Code
  reads it automatically each session. Cursor: move this into `.cursor/rules`.
- `PROJECT_NOTES.md` — the living design log the agent keeps updated.
- Use the per-turn message templates from your prompt doc to give feedback / add features.

## Structure
```
src/
  theme/        design tokens — colors, spacing/radius, typography (single source of truth)
  components/   shared: Button, Card, ScreenContainer
  navigation/   RootNavigator (stack) + bottom tabs
  screens/      one file per screen
  types/        Restaurant, Reward, PaymentMethod, User, ...
  services/     mock data: restaurants, rewards, payments (QRIS + card/bank)
```

## What's mocked
- All data is in-memory mock data (`src/services/`).
- `payments.ts` simulates QRIS pay and card/bank linking behind a stable interface —
  replace the bodies with a real PSP later without touching the screens.

## First things to do in your coding tool
1. Set the app name in `app.json` and `CLAUDE.md`.
2. "Build out the Restaurant detail screen" (it's currently a stub).
3. Add real font files and switch `src/theme/typography.ts` to use them.
