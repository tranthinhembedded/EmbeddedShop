# Architecture

## Runtime flow

- `App.tsx` loads `src/App.tsx`
- `src/App.tsx` wraps the app with:
  - `SafeAreaProvider`
  - `AppToastProvider`
  - `AppRuntimeBridge`
  - `AppErrorBoundary`
- `src/navigation/AppNavigator.tsx` owns:
  - splash -> main tabs
  - stack detail screens
  - advanced routes: `AdvancedLab`, `Diagnostics`, `NotFound`
  - deep linking + screen tracking

## State architecture

The app now uses persisted Zustand stores instead of keeping all runtime state inside a single React Context.

- `src/store/productStore.ts`
  - catalog filters
  - favorites
  - view modes
  - search history
- `src/store/cartStore.ts`
  - cart lines
  - cart total
  - checkout reset version
- `src/store/userStore.ts`
  - theme mode flag
  - profile
  - addresses
  - payment methods
  - orders
- `src/store/uiStore.ts`
  - offline mode
  - queued actions
  - toast queue
  - in-app notifications
- `src/store/monitorStore.ts`
  - analytics events
  - screen visits
  - api metrics
  - render metrics
  - frame metrics
  - memory samples
  - alerts

`src/store/shopAppContext.tsx` is now a thin compatibility layer that composes data from the Zustand stores so the existing screens can keep using `useShopApp()`.

## Persistence

- `src/services/persistence.ts` creates the MMKV storage instance
- Zustand persist middleware writes state to MMKV
- `src/services/storage.ts` now uses MMKV-backed helpers instead of the old in-memory map

## Telemetry

- `src/components/common/AppRuntimeBridge.tsx`
  - tracks frame-rate samples
  - tracks memory samples when available
  - auto-syncs queued actions when the app returns online
- `src/services/api.ts`
  - records API metrics
  - pushes monitor alerts
  - queues requests if the app is in offline mode
- navigation `onStateChange`
  - records screen visits

## Advanced showcase routes

- `src/screens/tools/AdvancedLabScreen.tsx`
  - responsive layout
  - horizontal rails
  - masonry section
  - sticky footer
  - swipe rows
  - pinch zoom
  - bottom sheet
  - drawer
  - modal
  - skeleton loading
- `src/screens/tools/DiagnosticsScreen.tsx`
  - telemetry dashboard
  - offline queue controls
  - alert/event/api/render feeds

## Deep linking

- config: `src/navigation/linking.ts`
- Android scheme + app-link intent filters: `android/app/src/main/AndroidManifest.xml`
- iOS custom URL scheme: `ios/ShopAIDemo/Info.plist`

Current prefixes:

- `embeddedshop://`
- `https://embeddedshop.example.com`

## Known limits

- FCM push delivery is not wired because the project has no Firebase credentials/config files
- HTTPS universal links/app links use a placeholder domain and still need real domain verification outside the repo
- `EmbeddedShopApp.tsx` remains large; the new architecture reduces state coupling, but the UI file still needs modular extraction
