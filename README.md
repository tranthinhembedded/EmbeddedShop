# EmbeddedShop

EmbeddedShop is a React Native e-commerce demo app focused on a polished shopping experience, theme support, and a richer component system than a default starter project.

## Highlights

- Modern storefront UI with product listing, search, cart, favorites, checkout, and profile flows
- Design-system driven styling with reusable tokens and themed surfaces
- Light and dark theme support
- Advanced UI patterns such as sheets, toasts, skeleton loading states, and richer empty states
- Android release build already generated as `EmbeddedShop-release.apk`

## Tech Stack

- React Native `0.84.1`
- React `19`
- TypeScript
- React Navigation

## Project Structure

```text
.
|-- App.tsx
|-- app.json
|-- assets/
|   `-- images/
|-- android/
|-- ios/
|-- package.json
`-- description.md
```

## Run Locally

Install dependencies:

```sh
npm install
```

Start Metro:

```sh
npm start
```

Run on Android:

```sh
npm run android
```

Run on iOS:

```sh
bundle install
cd ios
bundle exec pod install
cd ..
npm run ios
```

## Android Release Build

Build a release APK:

```sh
cd android
gradlew.bat assembleRelease
```

The project is configured to use short Windows build paths for native intermediates to reduce `MAX_PATH` issues during release builds.

## Repository Notes

- `EmbeddedShop-release.apk` is tracked with Git LFS to keep future binary updates manageable.
- Temporary logs and redundant archive artifacts are ignored from Git.
- The visible app name is `EmbeddedShop`.
- The current Android package/application id is still `com.shopaidemo`.

## Next Improvements

- Rename Android package and iOS bundle identifiers from the original starter values
- Publish APKs through GitHub Releases once GitHub CLI or another authenticated release workflow is available
- Add screenshots and setup notes specific to the project
