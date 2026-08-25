# Vendor dashboard — React

`src/vendor-dashboard/` · React 18 · Vite 5 · Tailwind 3 · react-leaflet 4.2

The collector's side. Which neighbourhoods are worth driving to, who is
waiting, and the road route to get there.

**Live:** https://nirvaha-vendor.netlify.app

## Files

| File | Does |
|---|---|
| `src/App.tsx` | Session, data loading, sockets, tabs, the route table |
| `src/components/Login.tsx` | Vendor sign-in — rejects household accounts |
| `src/components/RouteMap.tsx` | OpenStreetMap, zone circles, household pins, routing |
| `src/components/ZoneCard.tsx` | One neighbourhood: weight, households, claim |
| `src/components/ErrorBoundary.tsx` | Keeps a render crash from becoming a white page |

Three tabs: **Available Routes · Scheduled · Collection History**.

## What a vendor sees

Four stat tiles — waiting kg, households, **asked for pickup**, collected — then
zone cards and the map.

A zone where someone has actually requested collection gets an indigo ring and
*"N households asked for pickup · waiting 6 min"*, and **sorts above heavier
zones**. That ordering is the whole economic argument: a household waiting is
worth more than an extra kilogram nobody asked about.

## The map

OpenStreetMap tiles through `react-leaflet`. No Google Maps billing account.

Locked to Coimbatore — `maxBounds` plus `minZoom 11` / `maxZoom 16`, so it
cannot be dragged into the sea mid-demo.

| Marker | Meaning |
|---|---|
| Green circle | Zone still filling |
| Indigo circle | Zone with an active pickup request |
| Amber dashed | Zone already claimed |
| Small dot | One household — **one pin per door** |
| Violet badge | The vendor's warehouse, where routes start |

**One pin per household, not per item.** Earlier it drew a pin per bin row, so
a household with three bottles produced three markers at identical coordinates:
they stacked, only the top one was clickable, and its popup showed one bottle's
weight while the household's app showed their full total. A vendor drives to an
address, so that is what the map shows.

Routing calls OSRM through the API and draws a violet polyline from the
warehouse. A dashed line means a straight-line estimate rather than a road
path.

## Realtime

Socket.IO. `pickup:requested` pops a pulsing banner and reorders the board with
no refresh. If the socket drops, an amber **Reconnecting** chip appears and a
20-second poll takes over — the board never goes stale silently.

## Two bugs worth remembering

**Blank page on clicking a route.** The zones array was rebuilt inline every
render, so every `CircleMarker` unmounted and remounted. Clicking a button
inside an open popup destroyed the popup mid-event and took the tree down.
Fixed with `useMemo` for marker identity, closing the popup before the state
update, and an `ErrorBoundary` so a future crash is readable instead of white.

**Popups clipped at the map edge.** Fixed with `autoPan`, `keepInView`,
`autoPanPadding`, and a `max-height` with internal scroll in `index.css`.

## Build and deploy

```bash
cd src/vendor-dashboard
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
```

`VITE_API_BASE_URL` is read **at build time** and compiled into the bundle.
`.env` in this folder points at the deployed Railway API, so a plain
`npm run build` produces a deployable bundle.

> This bit once: a rebuild picked up a `.env` still saying `localhost:3000` and
> produced a bundle that asked the *judge's own laptop* for data. The page
> loaded and showed nothing. **Always check what the bundle calls before
> deploying:**
> ```bash
> grep -oE "https?://[a-z0-9.:-]*" dist/assets/*.js | sort -u
> ```

Deployed by dropping `dist/` on Netlify. `netlify.toml` at the repo root
documents the build for anyone connecting it to git later — `base` must be
`src/vendor-dashboard`, since building at the repo root is the commonest cause
of a blank deployed page.

## Pinned versions

`react-leaflet` is held at `^4.2`. Version 5 requires React 19.
