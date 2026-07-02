# Makan 🍜

> Discover nearby restaurants, earn points every visit, redeem perks — built for Southeast Asia.

**React Native · TypeScript · Expo · iOS + Android**

---

## What it is

Makan drives diners to discover and try local partner restaurants, then keeps them coming back through a lightweight rewards loop:

**discover nearby spots → dine & check in → earn points → redeem perks → explore more**

Built mobile-first for Indonesia (Jakarta), with IDR currency formatting and QRIS as the primary payment method.

---

## Screenshots

> Run the app with `npx expo start` and press `i` (iOS simulator) or scan the QR with Expo Go. Screenshots go in `docs/screenshots/` — filenames match the `<img>` `src` paths below.

<table>
  <tr>
    <td align="center"><b>Onboarding</b></td>
    <td align="center"><b>Discover (List)</b></td>
    <td align="center"><b>Discover (Map)</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/onboarding.png" width="200" alt="Onboarding screen" /></td>
    <td><img src="docs/screenshots/home_list.png" width="200" alt="Home list view" /></td>
    <td><img src="docs/screenshots/home_map.png" width="200" alt="Home map view" /></td>
  </tr>
  <tr>
    <td align="center"><b>Restaurant Detail</b></td>
    <td align="center"><b>Rewards Wallet</b></td>
    <td align="center"><b>Redeem</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/restaurant_detail.png" width="200" alt="Restaurant detail" /></td>
    <td><img src="docs/screenshots/rewards_wallet.png" width="200" alt="Rewards wallet" /></td>
    <td><img src="docs/screenshots/redeem.png" width="200" alt="Redeem flow" /></td>
  </tr>
  <tr>
    <td align="center"><b>Pay / QRIS</b></td>
    <td align="center"><b>Wallet & Payment Methods</b></td>
    <td align="center"><b>Profile</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/pay.png" width="200" alt="Pay / QRIS screen" /></td>
    <td><img src="docs/screenshots/wallet.png" width="200" alt="Wallet & payment methods" /></td>
    <td><img src="docs/screenshots/profile.png" width="200" alt="Profile & settings" /></td>
  </tr>
</table>

---

## Screens

| Screen | What it does |
|---|---|
| **Onboarding** | Single-screen welcome with tagline and "Get started" CTA |
| **Home / Discover** | Nearby partner restaurants in list or interactive map view; dual search bars for area + cuisine/name/tag; "NEW FOR YOU" badges on unvisited spots |
| **Restaurant Detail** | Hero section with cuisine emoji, open/closed status, price tier, distance; menu with dish recommendations based on dietary preferences; reviews; directions link; Pay & earn CTA |
| **Rewards Wallet** | Points balance at a glance (IDR-formatted); scrollable reward catalog with point costs; one-tap redeem |
| **Redeem** | Confirm reward, display a scannable voucher code |
| **Pay / QRIS** | Three pay modes — scan QR, enter bill number, or enter amount; confirm step with merchant name + fee breakdown; animated success state with points earned |
| **Wallet & Payment Methods** | Linked cards and bank accounts (last-4 only); add/remove; balance and transaction history |
| **Profile / Settings** | User info, dietary preferences, notification toggles, sign-out |

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React Native (Expo SDK 53) |
| Language | TypeScript (strict) |
| Navigation | React Navigation v7 — stack + bottom tabs |
| Maps | `react-native-maps` (native only, guarded behind `Platform.OS !== 'web'`) |
| Icons | `@expo/vector-icons` (Ionicons) |
| Payments | Mocked behind `src/services/payments.ts` — QRIS + card/bank; Midtrans / Xendit / Doku drops in later |
| Design system | Custom tokens in `src/theme/` — dark navy-purple palette, turquoise primary (`#2DD4BF`), warm gold reward accent (`#FBBF24`) |

---

## Project structure

```
src/
  theme/          Design tokens — colors, spacing/radius, typography
  components/     Shared UI: Button, Card, ScreenContainer
  navigation/     RootNavigator (stack) + bottom tabs
  screens/        One file per screen
  services/       Mock data + payment interface (restaurants, rewards, payments, visits…)
  types/          Shared TypeScript types (Restaurant, Reward, PaymentMethod, User…)
```

Key files:
- `CLAUDE.md` — persistent project instructions for the AI coding agent
- `PROJECT_NOTES.md` — living design log updated each session
- `src/services/payments.ts` — payment abstraction layer; replace only the function bodies when integrating a real PSP

---

## Run it

```bash
npm install
npx expo start       # press i (iOS simulator), a (Android emulator), or scan QR with Expo Go
```

**Requirements:** Node 18+. Full iOS simulator needs Xcode on macOS; Android emulator needs Android Studio. Quickest start: install **Expo Go** on your phone and scan the QR code printed in the terminal.

---

## What's mocked

All data is in-memory. The services layer (`src/services/`) provides stable interfaces so real APIs and a PSP can be swapped in without touching screen code:

| Service | What it simulates |
|---|---|
| `restaurants.ts` | Nearby feed, search/filter, restaurant detail, Jakarta area coordinates |
| `rewards.ts` | Points balance, reward catalog |
| `payments.ts` | QRIS flow, card/bank linking, transaction history |
| `visits.ts` | Check-in tracking (powers "NEW FOR YOU" discovery logic) |
| `recommendations.ts` | Dish recommendations keyed to user dietary preferences |
| `preferences.ts` | User preference persistence |

---

## Adding screenshots

1. Run `npx expo start` and open on iOS Simulator or Expo Go
2. Navigate to each screen and capture (`Cmd+S` in iOS Simulator saves to Desktop)
3. Create `docs/screenshots/` in this repo and add them with the filenames from the table above
4. Commit and push — GitHub renders them in this README automatically
