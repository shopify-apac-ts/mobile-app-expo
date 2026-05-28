# Dev Nobu Beer Store Mobile App

Expo SDK 54 mobile app for `dev-nobu-beer-store.myshopify.com`.

## Package Manager

This project uses pnpm only.

```bash
pnpm install
```

Use `pnpx` for one-off package execution. Do not use `npm` or `npx`.

## Local iPhone Development

This project is tested with local Xcode builds instead of Expo EAS.

```bash
pnpm prebuild:ios
pnpm open:ios
```

In Xcode:

1. Select the `DevNobuBeerStore` scheme.
2. Select the connected iPhone Air as the run destination.
3. Build and run from Xcode.

For a debug development build that talks to Metro:

```bash
pnpm start
```

For a Release device run, switch Xcode's Run build configuration to `Release`.

## Checks

```bash
pnpm lint
pnpm typecheck
```
