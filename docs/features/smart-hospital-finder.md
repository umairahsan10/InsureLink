# Smart Hospital Finder (Frontend Prototype)

## Overview

The Smart Hospital Finder enhances the patient portal with a Karachi-focused discovery experience. Patients can switch between:

- **Smart Finder tab** – interactive Leaflet map + distance-sorted list, drawing from geocoded panel hospitals.
- **Hospital Directory tab** – the original nationwide directory with filters for category, city, and search.

The feature relies entirely on frontend assets (React + Next.js) and browser APIs; no backend calls are made.

## Data & Dependencies

- **Hospital dataset**: `client/src/data/hospitals.json` now includes latitude/longitude, emergency, and 24/7 flags for Karachi panel entries.
- **Geocoding source**: One-off Nominatim script (`scripts/geocode-hospitals.ts`) produced coordinates using OpenStreetMap data. Missing matches (Timaz, Hafiz, Al-Khyber, Rehmat Jan) still require manual lookup.
- **Map stack**:
  - UI: `react-leaflet` + `leaflet` (OpenStreetMap tiles with default attribution).
  - Geolocation: custom `useGeolocation` hook wrapping the browser API with Karachi fallback + localStorage cache.
- **Utilities**: `client/src/utils/location.ts` exposes Haversine distance and formatting helpers.

## Smart Finder UX

1. **Location handling**
   - On load, the hook requests geolocation permission.
   - If granted, the map recenters and distances are recomputed; the last known location is cached (`localStorage`).
   - Permission denied / unsupported → fallback to Karachi city center with contextual messaging.
2. **Map experience**
   - `HospitalMap` renders panel hospitals with coordinates, highlighting the nearest facility and the actively selected hospital.
   - Popups surface address, availability badges, top specialties, and a deep link to start Google Maps navigation.
3. **List & filters**
   - Distance-sorted list mirrors filter state (reimbursable/non, emergency, 24/7, keyword search).
   - State persists between sessions (`localStorage`), including the last active hospital.
4. **Nearest hospital banner**
   - Displays the closest panel hospital, distance chip, and availability badges for quick action.
5. **Tabs**
   - Tab preference persists via `insurelink:patient-hospitals-tab`.
   - Desktop layout uses a 2-column grid (map right, list left); mobile collapses to stacked sections.

## Known Limitations / Follow-ups

- Geocode misses for four Karachi hospitals need manual coordinates (placeholder entries remain list-only).
- No in-app routing polyline or ETA yet; navigation opens Google Maps in a new tab.
- Manual location selection (e.g., district dropdown) is still TBD.
- Leaflet tiles depend on OpenStreetMap usage policy; monitor if traffic scales.

## Future Enhancements

- Add manual district picker + ability to drop a custom pin when geolocation is denied.
- Integrate lightweight routing (e.g., OpenRouteService) for inline ETA/polylines if we can secure free-tier API keys.
- Extend dataset/panels to additional cities once geocoding coverage is ready.
- Support “favorite hospitals” and pinned quick actions stored in localStorage.
- Explore clustering when the dataset grows beyond ~50 markers.

## Testing Notes

- Ensure browser runs over HTTPS or `localhost` for geolocation prompts.
- Verify both tabs on desktop and mobile breakpoints.
- Check Google Maps deep links on desktop + mobile devices.
- When coordinates change, re-run `npx --yes ts-node --transpile-only --project scripts/tsconfig.json scripts/geocode-hospitals.ts` to refresh cached metadata.

