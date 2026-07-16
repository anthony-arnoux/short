# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ShortCheck™ — a single-page, 100% client-side site (HTML/CSS/JS, no build
step, no backend) that answers one question: is wearing shorts authorized
today in Dijon, France? The rule: shorts are only "authorized" when Dijon
(Côte-d'Or, department 21) is under a **vigilance canicule rouge** (red
heatwave alert) from Météo-France. Anything below red (orange/jaune/vert) is
"not authorized".

## Commands

There is no build, lint, or test tooling — it's three static files served
as-is. To preview locally:

```bash
python3 -m http.server 8787
```

then open `http://localhost:8787`. (`.claude/launch.json` already defines
this as the `static-server` preview config.)

## Architecture

- **`app.js`** — all logic lives here as a single self-invoking function.
  - Fetches live data from `API_URL`, which points at a public **Opendatasoft**
    mirror (`public.opendatasoft.com`) of Météo-France's vigilance dataset —
    **not** data.gouv.fr directly. The official Météo-France API requires an
    API key and can't be called from a keyless static client, so this mirror
    (CORS-open, no auth) is the actual runtime dependency. Keep the
    `data.gouv.fr` vs. `Opendatasoft` distinction accurate in any UI copy —
    data.gouv.fr is the catalog/origin, Opendatasoft is what's actually
    queried over the network.
  - Query filters on `domain_id=21` (Côte-d'Or) and `phenomenon=canicule`,
    pulling both `echeance=J` (today) and `J1` (tomorrow) records.
  - `COLOR_MESSAGE` maps each vigilance color (rouge/orange/jaune/vert) to a
    distinct French one-liner shown as the subtext — these are intentionally
    written, not generated from a template; edit them directly rather than
    trying to derive them programmatically.
  - Results are cached in `localStorage` (`CACHE_KEY`, 15 min TTL) and
    auto-refreshed every `AUTO_REFRESH_MS`. On fetch failure, it falls back
    to the last cached value before showing an error state.
  - **Demo mode**: a `?demo=rouge|orange|jaune|vert` URL param bypasses the
    network fetch entirely and renders mock data, for previewing states
    without waiting for a real alert. Check `getDemoColor()` before assuming
    the app always hits the network.
- **`style.css`** — deliberately over-the-top "AI slop" visual style
  (glassmorphism, floating gradient blobs, shimmering gradient text,
  film-grain overlay). This aesthetic was a specific, intentional request —
  don't tone it down or "clean it up" unprompted. Color state is driven by
  `data-state` on `#card` (`loading` / `yes` / `no` / `error`), set from
  `app.js`.
- **`index.html`** — includes a persistent, non-dismissible disclaimer
  banner (`.warning-banner`, sticky to the top) stating that sleeveless
  puffer jackets are always forbidden regardless of alert level. This is a
  fixed requirement, not a placeholder — don't remove or make it dismissible.
- **`fonts/`** — Manrope and Sora, self-hosted as variable-font `.woff2`
  files. Fonts must stay bundled locally; do not reintroduce a Google Fonts
  (or any other external) `<link>` — this was explicitly removed to keep the
  site free of external runtime dependencies beyond the vigilance API call
  itself.
