# Component Documentation

## Design system

### `Button`

Path: `src/components/ui/Button.tsx`

Props:

- `variant`: `primary | secondary | outline | ghost`
- `size`: `sm | md | lg`
- `loading`
- `disabled`
- `leftIcon`
- `rightIcon`
- `fullWidth`

### `Input`

Path: `src/components/ui/Input.tsx`

Props:

- `label`
- `helperText`
- `error`
- `leftIcon`
- `rightIcon`

### `Card`

Path: `src/components/ui/Card.tsx`

Variants:

- `default`
- `elevated`
- `outlined`

### `Text`

Path: `src/components/ui/Text.tsx`

Variants:

- `heading`
- `body`
- `caption`

### `Badge`

Path: `src/components/ui/Badge.tsx`

Variants:

- `default`
- `success`
- `error`
- `warning`
- `info`

## Layout components

### `Container`

Path: `src/components/layout/Container.tsx`

- max width presets
- centered content
- responsive horizontal padding

### `Stack`

Path: `src/components/layout/Stack.tsx`

- horizontal or vertical
- configurable gap
- align/justify/wrap helpers

### `Grid`

Path: `src/components/layout/Grid.tsx`

- column presets
- responsive `sm` / `md` column overrides

## Advanced interaction components

### `SwipeActionRow`

Path: `src/components/advanced/SwipeActionRow.tsx`

- horizontal swipe reveal
- info/success/warning/error actions

### `GestureBottomSheet`

Path: `src/components/advanced/GestureBottomSheet.tsx`

- backdrop
- drag-to-dismiss
- animated entrance/exit

### `PinchZoomPanel`

Path: `src/components/advanced/PinchZoomPanel.tsx`

- two-finger pinch scaling
- spring reset on release

### `LoadingSkeleton`

Path: `src/components/advanced/LoadingSkeleton.tsx`

- shimmer placeholder
- configurable size and radius
