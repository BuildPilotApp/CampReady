# CampSync

Offline-first camping and road-trip packing utility. Plan trips, build reusable gear lists, and pack item-by-item with one-tap staging and checkoff, built for one-handed use in the field.

**Live app:** [buildpilotapp.github.io/CampReady](https://buildpilotapp.github.io/CampReady/)

## Features

- **Trip dashboard:** dates, location, packing progress, and weather
- **Gear checklist:** Needed → Staged → Packed workflow with category status colors
- **Saved gear lists:** reusable inventories you can load onto any trip
- **Export:** copy as text, download CSV, or save an app backup (free)
- **Import & merge:** restore backups without duplicates (Lifetime Pro)
- **Privacy-first:** no accounts, no analytics; data stays on your device

## Free vs Pro

| | Free | Lifetime Pro |
|---|------|----------------------|
| Trips | 1 | Unlimited |
| Saved checklists | 1 | Unlimited |
| Pack workflow | Full | Full |
| Export | Yes | Yes |
| Import / merge | No | Yes |

**Android:** Lifetime Pro is a one-time purchase through Google Play (`campready_pro_lifetime`).

**iOS:** Lifetime Pro is a one-time purchase through the App Store (same product ID: `campready_pro_lifetime`).

**Web (GitHub Pages):** checklist features work in the browser; Pro purchase is available in the CampSync mobile apps.

Support: [support@buildpilotapps.com](mailto:support@buildpilotapps.com)

## Release builds

Edit `src/lib/build-config.ts` before uploading store builds:

| Build | `IS_PRIME_TEST_LAB_BUILD` |
|-------|---------------------------|
| PrimeTestLab / closed testing | `true` |
| Production (current) | `false` |

Then run `npm run cap:sync` and build a signed release AAB (Android) or Archive in Xcode / Codemagic (iOS).

## iOS / Codemagic

iOS TestFlight builds are **not** started on every push to `main` (GitHub Actions already deploys the web app from `main`). Codemagic reads [`codemagic.yaml`](./codemagic.yaml) and uploads an IPA to TestFlight only.

**First-time setup (App Store Connect + Codemagic UI):**

1. Create the app record with bundle ID `com.buildpilotapps.campready` and In-App Purchase product `campready_pro_lifetime`.
2. Create an App Store Connect API key (App Manager), then in Codemagic Team settings → Apple Developer Portal add it with the integration name **`CampReady`** (must match `integrations.app_store_connect` in `codemagic.yaml`).
3. Generate an Apple Distribution certificate and App Store provisioning profile for `com.buildpilotapps.campready`.
4. Set application env var `APP_STORE_APPLE_ID` to the numeric Apple ID from App Store Connect → App Information.
5. Start the first build manually in Codemagic (`ios-testflight` on `main`).

**Later iOS builds:** push a tag matching `ios-*` (does not submit for App Store review):

```bash
git tag ios-1.0.4
git push origin ios-1.0.4
```

Submit for App Store review from App Store Connect after TestFlight QA, screenshots, and listing metadata. Do not put `.p8` keys, certificates, or provisioning profiles in git.

Hosted legal pages for App Store Connect:

- Privacy: https://buildpilotapp.github.io/CampReady/privacy/
- Terms: https://buildpilotapp.github.io/CampReady/terms/

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to out/
npm test           # unit tests
npm run lint
```

### Mobile (Capacitor)

Android and iOS share this project. Native shells live in `android/` and `ios/`.

```bash
npm run cap:sync   # build + copy to android/ and ios/
npm run cap:android
npm run cap:ios    # requires macOS + Xcode
```

## Deploy

Pushes to `main` deploy automatically to GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`).

## Privacy

See [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) and the hosted page at [buildpilotapp.github.io/CampReady/privacy](https://buildpilotapp.github.io/CampReady/privacy/). The in-app Information menu also includes the full privacy policy.

## License

Private. All rights reserved unless otherwise noted.
