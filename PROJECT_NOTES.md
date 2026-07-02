# Project Notes (living design log)

> Maintained by the agent. Update whenever a decision is made or a screen ships.

## Stack
- React Native + TypeScript via Expo. React Navigation (native-stack + bottom-tabs).
- Mock data/services under `src/services/`; no backend yet.

## Status of screens
| Screen | State |
| --- | --- |
| Onboarding | Starter — intro + entry buttons |
| Home / Discover | Enhanced — List/Map toggle; map view with pin markers + bidirectional bottom card strip |
| Restaurant detail | Complete — hero, gallery, save, reward card, **Quick Actions bar** (Reserve / Menu / Directions), menu modal, reservation modal w/ date+time+party picker + in-sheet confirmation, directions via native Maps, tappable address in About |
| Rewards wallet | Starter — points balance + redeemable catalog |
| Redeem | Stub — needs cost-vs-balance, code generation, success state |
| Pay (QRIS) | Tab stub only — generic mock, superseded by RestaurantPayScreen for restaurant-context payments |
| Restaurant pay | Complete — Scan QR / Bill Number / Enter Amount modes, shared confirm step, success celebration |
| Wallet & payment methods | Starter — lists methods, demo card link; needs real forms |
| Profile | Complete — avatar, wallet, gastronomes social section (following strip + stat row), favourite spots, settings |
| Gastronomes | Complete — Following/Followers tabs, per-row follow/unfollow with optimistic update, tier badges |

## Key design decisions
- **Palette (deliberate, not the default cream/terracotta):** sambal red `#E4451E`
  for actions, pandan green `#1E9E6A` for earned/reward states, turmeric gold `#F2B33D`
  for points/celebration, warm-white `#FBFAF7` background, warm near-black `#1A1714` ink.
  Grounded in SE Asian food-market vernacular.
- **Typography:** system font as the runnable default. Recommended swap — a characterful
  grotesk display + Inter body (add `expo-font` + font files, set family in
  `src/theme/typography.ts`).
- **Payments are mocked** behind `paymentsService` so the swap to a real PSP is drop-in.
- **RestaurantPayScreen** (`src/screens/RestaurantPayScreen.tsx`) is the canonical pay entry point, reached from `RestaurantDetail`. It carries `restaurantId`, `restaurantName`, and `rewardRate` as nav params. The three input modes (QR, bill lookup, manual amount) all converge to one `ConfirmCard` then `paymentsService.pay()`. The generic `PayScreen` tab is left as a placeholder — unify or remove it once auth + payment method selection land.
- **`paymentsService.lookupBill`** returns a deterministic mock amount seeded from the bill number string.
- **Profile avatar** is initials-only for now (no `expo-image-picker`). The edit badge is tappable and shows an Alert stub — hook up real upload when the library lands.
- **Wallet balance** (`WalletBalance` type) is IDR stored-value, separate from `pointsBalance`. Broken into `cashbackEarned` and `toppedUp`. Mocked in `userService`.
- **Favourite spots** (`FavouriteSpot[]` on `UserProfile`) join against `restaurantsService.getNearby()` in-screen to get display data. Tapping navigates to `RestaurantDetail`.
- **`userService.ts`** is the new mock for profile + wallet; swap for a real `/me` endpoint later.

## Restaurant detail design decisions
- **Photo tiles** are colored placeholders (cuisine-mapped emoji + bg color) until real image uploads exist. The `photos` field on `Restaurant` is already typed so swapping in `<Image>` later is a one-line change per tile.
- **Save state** is local `useState` for now — needs moving to user context / persistence once auth lands.
- **"Also nearby"** uses `navigation.push` so users can chain restaurant browsing without losing back history.
- **Points preview** calculates inline from `rewardRate` (pts per Rp 1.000) — no backend needed.
- **Tabs nav type** updated to `NavigatorScreenParams<TabParamList>` so `navigation.navigate('Tabs', { screen: 'Pay' })` type-checks correctly.

## Gastronomes / social layer
- **`Gastronome` type** added to `src/types/index.ts` — `id`, `name`, `initials`, `avatarColor`, `city`, `pointsBalance`, `isFollowing`.
- **Tier system** (purely cosmetic, based on `pointsBalance`): Foodie < 500 · Regular 500–1999 · Gourmand 2000–4999 · Gastronome 5000+. Colored badge in list rows.
- **`userService.getConnections()`** returns `{ following, followers }` from an in-memory mutable array so `toggleFollow` reflects immediately.
- **`ProfileScreen`** shows a social stats row (tappable "12 Following · 47 Followers") in the identity block + a horizontal avatar strip for following. Both navigate to `GastronomesScreen`.
- **`GastronomesScreen`** — custom header, two-tab switcher (Following / Followers), `FlatList` with follow/unfollow button and per-row loading spinner. Optimistic update via state reconciliation in `handleToggleFollow`.
- **`followingCount` / `followersCount`** are derived at read time from the mutable array so the profile stats stay consistent.

## Discover location search (added 2026-06-27)
- **Search bar** in the fixed header below the title row — location pin icon, `TextInput`, clear (×) button.
- **Suggestions dropdown** — 22 Jakarta neighborhoods, filtered as you type; `maxHeight: 220` so it scrolls; rendered absolutely at `top: headerHeight` (measured via `onLayout`) so it overlays list/map.
- **Blur-with-delay** pattern (`setTimeout 150ms`) lets tapping a suggestion register before `onBlur` hides the list.
- **Filtering** — `allRestaurants` (full fetch) is kept; `restaurants` (displayed) is the filtered subset. `restaurantsRef` is synced to `restaurants` via an effect so pin→list scroll still works on filtered sets.
- **Map panning** — on commit, uses `JAKARTA_AREA_COORDS` preset; falls back to centroid of matched restaurants; clear resets to `JAKARTA_REGION`.
- **Dynamic label** — `NEARBY · JAKARTA` becomes `NEARBY · {AREA}` when a location is committed.
- **Empty state** — location-aware: "No partner restaurants in [area] yet." vs generic fallback.
- **`JAKARTA_AREA_SUGGESTIONS` / `JAKARTA_AREA_COORDS`** exported from `src/services/restaurants.ts`.

## Discover map view (added 2026-06-27)
- **Library:** `react-native-maps` (~1.14.0), native-only. Web falls back silently (toggle hidden on Platform.OS === 'web').
- **Bidirectional sync:** scrolling the bottom card strip pans the map to the card's restaurant and highlights its pin; tapping a pin scrolls the bottom strip to that card.
- **Pin markers:** 40×40 emoji circles in `colors.primary`. Selected state grows to 50×50 with white border + heavier shadow.
- **Bottom strip cards:** horizontal `FlatList`, 80% screen width each, white + `colors.primary` border when selected, individual shadow — transparent tray so the map shows through.
- **Coordinates:** mocked as realistic Jakarta lat/lng on each `Restaurant` (typed as `lat: number; lng: number`). Swap for real geocoding when backend lands.
- **`getItemLayout`** is set on the bottom FlatList so `scrollToIndex` (pin tap → list scroll) is reliable without a layout scan.

## AI dish recommendations (added 2026-06-28)
- **`src/services/preferences.ts`** — module-level store (same pattern as `visitsService`) exposing `get()`, `set(dietary, cuisines)`, `hasAny()`. Stays in sync with `ProfileScreen` local state via the two `handleToggle*` handlers.
- **`src/services/recommendations.ts`** — calls Claude (`claude-opus-4-8`, adaptive thinking) with the restaurant's `menuHighlights` and user prefs. Returns `DishRecommendation[]` (dishName + reason). Simple in-memory Map cache keyed by `restaurantId + JSON(prefs)` avoids repeat API calls within a session.
- **`RecommendedDishes` component** — placed in `RestaurantDetailScreen` after `RewardCard`, before `QuickActions`. Shows a teal-bordered card list when results arrive; spinner + "Personalising…" while loading; graceful no-match and error states. Hidden entirely if no preferences are set (no noise for new users).
- **API key** — stored in `.env` as `EXPO_PUBLIC_ANTHROPIC_API_KEY` (Expo SDK env var, available in `process.env`). File is already in `.gitignore`. Production should proxy through a backend endpoint so the key never ships in the bundle.
- **`dangerouslyAllowBrowser: true`** on the Anthropic client — needed because the SDK detects non-Node environments. Safe for this prototype context.

## Open questions
- App name (placeholder `[Your App Name]` in `app.json` + `CLAUDE.md`).
- Which PSP for QRIS + card/bank (Midtrans / Xendit / Doku)?
- Auth approach (phone OTP is common in Indonesia) — onboarding is currently a stub.
- Do restaurants get their own app/portal, or web-only?
