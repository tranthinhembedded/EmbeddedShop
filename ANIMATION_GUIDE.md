# Animation Guide

## Existing animation layers

- Splash animation: `src/screens/auth/SplashScreen.tsx`
- Tab transition overlay: `src/navigation/AppNavigator.tsx`
- Add-to-cart CTA feedback: `src/screens/product/ProductDetailScreen.tsx`
- Toast entrance: `src/components/common/AppToastProvider.tsx`
- Bottom sheet drag + dismissal: `src/components/advanced/GestureBottomSheet.tsx`
- Drawer slide animation: `src/screens/tools/AdvancedLabScreen.tsx`
- Skeleton shimmer: `src/components/advanced/LoadingSkeleton.tsx`

## Gesture-linked interactions

- Swipe rows: `src/components/advanced/SwipeActionRow.tsx`
- Pinch zoom: `src/components/advanced/PinchZoomPanel.tsx`
- Bottom sheet drag: `src/components/advanced/GestureBottomSheet.tsx`

## Guidelines

- Favor meaning over decoration
- Use animation to clarify state changes:
  - opening context
  - confirming action
  - dismissing temporary UI
  - indicating load progress
- Keep durations short for repeated interactions
- Avoid stacking multiple full-screen overlays with unrelated motion

## Next improvements

- migrate more interaction-heavy flows to Reanimated-driven layout transitions
- add shared-element transitions for product cards -> product detail
- add insertion/deletion layout animation in the main cart flow
