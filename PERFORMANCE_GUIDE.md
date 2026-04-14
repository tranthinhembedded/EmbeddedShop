# Performance Guide

## What is already in place

- Zustand store slices reduce state coupling compared to the old single context state
- MMKV persistence avoids async storage bottlenecks for core local state
- `useDeferredValue` is still used in the catalog search flow
- product rails and advanced showcase listing use `FlatList`
- runtime telemetry collects:
  - frame samples
  - memory samples when available
  - render timings
  - API timings

## Where to inspect performance

- open `Diagnostics` from Settings
- review:
  - average FPS
  - latest memory sample
  - recent render metrics
  - recent API metrics
  - monitor alerts

## Current rules

- Prefer store selectors over broad object reads when adding new screens
- Use `FlatList` or `SectionList` for long lists
- Keep persisted payloads small and partialized
- Cap telemetry queues and event history
- Avoid reintroducing large in-memory derived state in components

## Recommended next optimizations

1. Replace the biggest `ScrollView` sections in `src/EmbeddedShopApp.tsx` with virtualized lists.
2. Split the monolithic tab screen into screen modules per tab.
3. Add image caching/compression strategy if remote images are introduced.
4. Add route-level lazy loading for advanced tools and low-frequency screens.
5. Add a release performance smoke checklist before shipping.
