# Best Practices

## State

- Put persistent business state in Zustand stores
- Keep UI-only temporary toggles local unless multiple screens need them
- Use store partial persistence instead of storing the whole state tree
- Prefer store actions for cross-cutting side effects such as telemetry or offline queueing

## Navigation

- Add every new screen to `src/navigation/types.ts`
- If a screen should be reachable externally, wire it in `src/navigation/linking.ts`
- Track important screens through navigation state changes instead of ad-hoc screen effects

## Styling

- Reuse tokens from the design system before adding new raw values
- Prefer NativeWind for new reusable components
- Keep high-density prototype screens isolated from the main storefront until stable

## Performance

- Prefer `FlatList` for long or repeated sections
- Avoid broad selectors that read entire stores when a small slice is enough
- Cap queues and telemetry arrays
- Measure first with Diagnostics before optimizing blindly

## Testing

- Add unit tests for store actions when introducing new persisted state
- Keep advanced runtime pieces mockable in Jest
- Use Maestro flows for smoke scenarios that cross multiple screens

## Delivery

- Add new advanced patterns through isolated routes first
- Backfill the main storefront only after the pattern is stable
- Do not add third-party service SDKs that require credentials unless the repo has the needed environment/config files
