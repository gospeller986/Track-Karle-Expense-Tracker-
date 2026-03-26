# Build Guide

All commands run from `frontend/`.

## APK (for testing / sideloading)

```bash
cd frontend
eas build --platform android --profile preview
```

Downloads as a fat APK (~50–70 MB) containing all CPU architectures.
Link appears in terminal and at [expo.dev](https://expo.dev) when done.

### Smaller APK (arm64 devices only — most modern Android phones)

```bash
eas build --platform android --profile preview-arm64
```

Builds only the `arm64-v8a` slice (~30–40 MB). Works on any Android phone made after ~2015. Use this for quick testing rounds.

## AAB — Google Play Store

```bash
eas build --platform android --profile production
```

Produces an `.aab` (Android App Bundle). Play Store splits it per device ABI automatically, so the download users get is the smallest possible. This is what you submit to the Play Store.

## iOS (App Store / TestFlight)

```bash
eas build --platform ios --profile production
```

Requires an Apple Developer account configured in EAS.

## Both platforms at once

```bash
eas build --platform all --profile production
```

---

## APK Size — What Was Done

| Change | Est. savings |
|--------|-------------|
| Removed `react-native-reanimated` + `react-native-worklets` (only used by unused boilerplate) | ~8–12 MB |
| Removed `expo-symbols` (iOS-only, unused) | ~2–3 MB |
| Deleted unused boilerplate components (`hello-wave`, `parallax-scroll-view`, `collapsible`, `icon-symbol`, `external-link`) | JS bundle savings |
| Enabled ProGuard (`enableProguardInRelease: true` in `app.json`) | ~5–10 MB native code |
| arm64-only build profile | Halves native `.so` size |

For the Play Store, always use the `production` AAB profile — Play handles size optimisation automatically.

---

## Checklist before building

- [ ] `frontend/.env` points to the production Render URL (not localhost)
- [ ] `app.json` `version` and `android.versionCode` are bumped for new releases
- [ ] Run `npx expo export` locally to catch any bundler errors before queuing an EAS build
