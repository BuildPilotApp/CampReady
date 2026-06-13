# CampReady

Offline-first camping and road-trip packing utility. Plan trips, build reusable gear lists, and pack item-by-item with one-tap staging and checkoff — built for one-handed use in the field.

**Live app:** [buildpilotapp.github.io/CampReady](https://buildpilotapp.github.io/CampReady/)

## Features

- **Trip dashboard** — dates, location, packing progress, and weather
- **Gear checklist** — Needed → Staged → Packed workflow with category status colors
- **Saved gear lists** — reusable inventories you can load onto any trip
- **Export** — copy as text, download CSV, or save an app backup (free)
- **Import & merge** — restore backups without duplicates (Lifetime Pro)
- **Privacy-first** — no accounts, no analytics; data stays on your device

## Free vs Pro

| | Free | Lifetime Pro ($4.99) |
|---|------|----------------------|
| Trips | 1 | Unlimited |
| Saved checklists | 1 | Unlimited |
| Pack workflow | Full | Full |
| Export | Yes | Yes |
| Import / merge | — | Yes |

Pro is a one-time purchase per device. After Stripe checkout, return to CampReady and Pro unlocks automatically.

**Stripe success URL (web):** configure your Payment Link to redirect to:

`https://buildpilotapp.github.io/CampReady/?checkout=success`

**Native builds:** use `campready://checkout/success` as the Payment Link success URL.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to out/
npm test           # unit tests
npm run lint
```

### Mobile (Capacitor)

```bash
npm run cap:sync   # build + copy to android/ and ios/
npm run cap:android
npm run cap:ios
```

## Deploy

Pushes to `main` deploy automatically to GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`).

## Privacy

See [PRIVACY_POLICY.md](./PRIVACY_POLICY.md). The in-app Information menu also includes the full privacy policy.

## License

Private — all rights reserved unless otherwise noted.
