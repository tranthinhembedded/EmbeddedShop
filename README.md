# EmbeddedShop

EmbeddedShop is now a React Native storefront for embedded hardware, robotics modules, FPGA boards, and industrial IO. The visual language has been refocused around a control-room aesthetic instead of a generic consumer shop.

## Highlights

- Embedded-electronics catalog with Raspberry Pi kits, FPGA boards, motor drivers, sensors, and robot chassis
- Technology-first visual system using graphite surfaces, cyan-lime accents, and panel-like hardware cards
- App shell with home, catalog, saved items, cart, checkout, profile, and order history flows
- Local hardware glyph rendering so the product presentation feels technical even without external image assets
- NativeWind-based design system and theme provider
- Persisted Zustand + MMKV state layer for product, cart, user, UI, and telemetry domains
- Advanced tooling routes for `AdvancedLab` and `Diagnostics`
- Deep linking support for `embeddedshop://` and `https://embeddedshop.example.com`

## Tech Stack

- React Native `0.84.1`
- React `19`
- TypeScript
- React Navigation dependencies remain installed in the project

## Project Structure

```text
.
|-- App.tsx
|-- ARCHITECTURE.md
|-- PERFORMANCE_GUIDE.md
|-- ANIMATION_GUIDE.md
|-- COMPONENT_DOCUMENTATION.md
|-- BEST_PRACTICES.md
|-- .maestro/
|-- src/
|   |-- EmbeddedShopApp.tsx
|   |-- catalog.ts
|   |-- theme.ts
|   |-- navigation/
|   |-- store/
|   `-- screens/
|   `-- components/
|       `-- HardwareGlyph.tsx
|-- android/
|-- ios/
|-- package.json
`-- description.md
```

## Run Locally

```sh
cmd /c npm install
cmd /c npm start
cmd /c npm run android
```

For iOS:

```sh
bundle install
cd ios
bundle exec pod install
cd ..
npm run ios
```

## Advanced Routes

- `Settings -> Open advanced lab`
- `Settings -> Open diagnostics`

## Deep Linking

Examples:

- `embeddedshop://advanced-lab`
- `embeddedshop://diagnostics`
- `embeddedshop://product/pi5-lab-kit/home`
