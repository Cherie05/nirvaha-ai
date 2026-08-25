import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/** Coimbatore only — the map cannot be dragged out of the service area. */
export const COIMBATORE_CENTRE: [number, number] = [11.0168, 76.9558];
export const COIMBATORE_BOUNDS: [[number, number], [number, number]] = [
  [10.9, 76.85],
  [11.1, 77.1],
];

/**
 * One HOUSEHOLD waiting to be collected — not one item.
 *
 * The map used to draw a pin per bin row, so a household with three bottles
 * produced three markers at identical coordinates. They stacked, only the top
 * one could be clicked, and its popup showed one bottle's weight while the
 * household's app showed their full total.
 */
export interface Pickup {
  id: string;
  itemIds?: string[];
  zone: string;
  latitude: number;
  longitude: number;
  /** Heaviest resin code, used as the pin's headline. */
  materialType: string;
  /** kg per resin code across everything this household has set aside. */
  materials?: Record<string, number>;
  weightKg: number;
  itemCount?: number;
  householdName?: string;
  requested?: boolean;
  status: string;
  address?: string | null;
}

export interface Warehouse {
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  ok: boolean;
  mode: 'road' | 'direct';
  distanceKm: number;
  durationMin: number;
  path: [number, number][];
  label: string;
  totalKg: number;
  households: number;
  destinationAddress?: string;
  destination?: { lat: number; lng: number } | null;
  zone?: string;
  pickupId?: string;
}

export interface ZonePoint {
  zone: string;
  latitude: number;
  longitude: number;
  totalWeightKg: number;
  userCount: number;
  /** kg per resin code, so a vendor can judge processing capacity. */
  breakdown?: Record<string, number>;
  itemCount?: number;
  /** Households in this zone that have actively asked to be collected. */
  requestedCount?: number;
  /** SCHEDULED zones stay visible in amber so a claimed route is still
   *  routable and can be marked collected from the map. */
  scheduled?: boolean;
}

const MATERIAL_STYLES: Record<string, string> = {
  'PET 1': 'bg-sky-100 text-sky-800',
  'HDPE 2': 'bg-emerald-100 text-emerald-800',
  'PVC 3': 'bg-rose-100 text-rose-800',
  'LDPE 4': 'bg-amber-100 text-amber-800',
  'PP 5': 'bg-violet-100 text-violet-800',
  'PS 6': 'bg-orange-100 text-orange-800',
  'OTHER 7': 'bg-slate-200 text-slate-700',
};

/** Violet appears nowhere else on the map, so origin and route read as one. */
export const WAREHOUSE_COLOR = '#7c3aed';

const warehouseIcon = L.divIcon({
  className: '',
  html: `<div style="display:flex;align-items:center;gap:6px;background:${WAREHOUSE_COLOR};
    color:#fff;border-radius:12px;padding:6px 10px;font:800 11px system-ui;
    white-space:nowrap;box-shadow:0 3px 10px rgba(124,58,237,.45);
    border:3px solid #fff">&#127981; WAREHOUSE</div>`,
  iconSize: [120, 30],
  iconAnchor: [60, 15],
});

/** Keeps the viewport inside the service area even after programmatic moves. */
function LockToCoimbatore() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(COIMBATORE_BOUNDS);
    map.setMinZoom(11);
    map.setMaxZoom(16);
  }, [map]);
  return null;
}

export default function RouteMap({
  zones,
  pickups,
  warehouse,
  onClaim,
  busyZone,
  onRoute,
  route,
  onClearRoute,
  onPickedUp,
  pickingUp,
}: {
  zones: ZonePoint[];
  pickups: Pickup[];
  warehouse: Warehouse | null;
  onClaim: (zone: string) => void;
  busyZone: string | null;
  onRoute: (opts: { zone?: string; pickupId?: string }) => void;
  route: RouteResult | null;
  onClearRoute: () => void;
  onPickedUp: (route: RouteResult) => void;
  pickingUp: boolean;
}) {
  const copyAddress = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard needs a secure context; fall back to a prompt so the
      // vendor can still copy the address by hand.
      window.prompt('Copy this address', text);
    }
  };
  return (
    <div className="soft-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f3f1] px-6 py-4">
        <div>
          <h3 className="text-[17px] font-extrabold text-[#0b1f14]">
            Collection map
          </h3>
          <p className="mt-0.5 text-xs text-[#9aa8a1]">
            {pickups.length} pickup point{pickups.length === 1 ? '' : 's'} ·{' '}
            {zones.length} zone{zones.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-3.5 text-xs font-medium text-[#6b7b72]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Filling
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Requested
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Scheduled
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: WAREHOUSE_COLOR }}
            />{' '}
            Warehouse
          </span>
        </div>
      </div>

      {route && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4"
          style={{ background: '#f8f6ff', borderColor: '#ece9fe' }}
        >
          <div className="text-sm">
            <span className="font-extrabold" style={{ color: WAREHOUSE_COLOR }}>
              Warehouse &rarr; {route.label}
            </span>
            <span className="tabular ml-3 text-[#6b7b72]">
              <b className="text-[#0b1f14]">
                {(route.distanceKm ?? 0).toFixed(1)} km
              </b>{' '}
              · {route.durationMin ?? 0} min ·{' '}
              <b className="text-[#0b1f14]">
                {(route.totalKg ?? 0).toFixed(2)} kg
              </b>{' '}
              · {route.households ?? 0} household
              {(route.households ?? 0) === 1 ? '' : 's'}
            </span>
            {route.mode === 'direct' && (
              <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                straight-line estimate
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onClearRoute}
              className="rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-[#6b7b72] shadow-[0_2px_8px_-2px_rgba(11,31,20,0.1)] transition hover:text-[#0b1f14]"
            >
              Clear route
            </button>
          </div>

          <div className="w-full rounded-2xl bg-white p-4 shadow-[0_4px_14px_-4px_rgba(11,31,20,0.1)]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9aa8a1]">
              Go to this place
            </p>
            <p className="mt-1.5 select-all text-sm font-bold text-[#0b1f14]">
              {route.destinationAddress || route.label}
            </p>
            {route.destination && (
              <p className="mt-1 select-all font-mono text-xs text-[#9aa8a1]">
                {Number(route.destination.lat).toFixed(6)},{' '}
                {Number(route.destination.lng).toFixed(6)}
              </p>
            )}

            <div className="mt-3.5 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  copyAddress(route.destinationAddress || route.label)
                }
                className="rounded-xl bg-[#f4f6f5] px-3.5 py-2 text-xs font-bold text-[#6b7b72] transition hover:text-[#0b1f14]"
              >
                Copy address
              </button>

              {route.destination && (
                <button
                  onClick={() =>
                    copyAddress(
                      `https://www.google.com/maps/dir/?api=1&destination=${route.destination!.lat},${route.destination!.lng}&travelmode=driving`,
                    )
                  }
                  className="rounded-xl bg-[#f4f6f5] px-3.5 py-2 text-xs font-bold text-[#6b7b72] transition hover:text-[#0b1f14]"
                >
                  Copy Maps link
                </button>
              )}

              {route.destination && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${route.destination.lat},${route.destination.lng}&travelmode=driving`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl px-3.5 py-2 text-xs font-bold text-white"
                  style={{ background: WAREHOUSE_COLOR }}
                >
                  Open in Google Maps
                </a>
              )}

              <button
                onClick={() => onPickedUp(route)}
                disabled={pickingUp}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition ${
                  pickingUp
                    ? 'cursor-not-allowed bg-[#c8d2cd]'
                    : 'bg-[#059669] shadow-[0_8px_18px_-8px_rgba(5,150,105,0.9)] hover:bg-[#047857]'
                }`}
              >
                {pickingUp ? 'Saving…' : 'Picked up'}
              </button>
            </div>
          </div>
        </div>
      )}

      <MapContainer
        center={COIMBATORE_CENTRE}
        zoom={12}
        minZoom={11}
        maxZoom={16}
        maxBounds={COIMBATORE_BOUNDS}
        maxBoundsViscosity={1}
        scrollWheelZoom
        style={{ height: 560, width: '100%' }}
      >
        <LockToCoimbatore />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {Array.isArray(route?.path) &&
        route.path.length > 1 &&
        route.path.every(
          (p) =>
            Array.isArray(p) &&
            Number.isFinite(p[0]) &&
            Number.isFinite(p[1]),
        ) ? (
          <>
            <Polyline
              positions={route.path}
              pathOptions={{
                color: WAREHOUSE_COLOR,
                weight: 5,
                opacity: 0.85,
                dashArray: route.mode === 'direct' ? '10 8' : undefined,
              }}
            />
            <Polyline
              positions={route.path}
              pathOptions={{ color: '#fff', weight: 1.5, opacity: 0.9 }}
            />
          </>
        ) : null}

        {/* Zone clusters — radius scales with aggregated weight */}
        {zones.map((z) => (
          <CircleMarker
            key={`zone-${z.zone}`}
            center={[z.latitude, z.longitude]}
            radius={Math.min(38, 14 + z.totalWeightKg * 2.5)}
            pathOptions={{
              // Indigo means someone in there is waiting on an answer, so it
              // reads differently from a zone that merely happens to be heavy.
              color: z.scheduled
                ? '#d97706'
                : (z.requestedCount ?? 0) > 0
                  ? '#4f46e5'
                  : '#059669',
              weight: (z.requestedCount ?? 0) > 0 && !z.scheduled ? 3 : 2,
              dashArray: z.scheduled ? '6 5' : undefined,
              fillColor: z.scheduled
                ? '#f59e0b'
                : (z.requestedCount ?? 0) > 0
                  ? '#6366f1'
                  : '#10b981',
              fillOpacity: 0.18,
            }}
          >
            <Popup
              autoPan
              keepInView
              autoPanPadding={[24, 24]}
              maxWidth={250}
              minWidth={210}
            >
              <div className="min-w-[200px]">
                <p className="text-sm font-extrabold leading-tight text-slate-900">
                  {z.zone}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  <b className="text-sm">{z.totalWeightKg.toFixed(2)} kg</b> ·{' '}
                  {z.userCount} household{z.userCount === 1 ? '' : 's'}
                </p>
                {z.scheduled && (
                  <p className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                    Pickup scheduled
                  </p>
                )}
                {!z.scheduled && (z.requestedCount ?? 0) > 0 && (
                  <p className="mt-1 inline-block rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800">
                    {z.requestedCount} asked for pickup
                  </p>
                )}

                {z.breakdown && Object.keys(z.breakdown).length > 0 && (
                  <div className="mt-1.5 border-t border-slate-100 pt-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      Material breakdown
                    </p>
                    <div className="mt-1 space-y-px">
                      {Object.entries(z.breakdown)
                        .sort((a, b) => b[1] - a[1])
                        .map(([mat, kg]) => (
                          <div
                            key={mat}
                            className="flex items-center justify-between gap-2 text-[11px]"
                          >
                            <span
                              className={`rounded px-1.5 py-px font-semibold ${
                                MATERIAL_STYLES[mat] ?? 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {mat}
                            </span>
                            <span className="font-bold text-slate-700">
                              {kg.toFixed(2)} kg
                            </span>
                          </div>
                        ))}
                    </div>
                    {z.itemCount ? (
                      <p className="mt-1 text-[10px] text-slate-500">
                        {z.itemCount} item{z.itemCount === 1 ? '' : 's'}
                      </p>
                    ) : null}
                  </div>
                )}
                <div className="sticky bottom-0 mt-1.5 bg-white pt-1">
                <button
                  onClick={(e) => {
                    // Close the popup first: updating state while Leaflet has
                    // an open popup attached to this marker is what blanked
                    // the page.
                    (e.currentTarget.closest('.leaflet-popup') as HTMLElement)
                      ?.querySelector<HTMLAnchorElement>('.leaflet-popup-close-button')
                      ?.click();
                    onRoute({ zone: z.zone });
                  }}
                  className="w-full rounded-md px-2 py-1 text-[11px] font-bold text-white"
                  style={{ background: WAREHOUSE_COLOR }}
                >
                  Show route from warehouse
                </button>
                {!z.scheduled && (
                  <button
                    onClick={(e) => {
                      (e.currentTarget.closest('.leaflet-popup') as HTMLElement)
                        ?.querySelector<HTMLAnchorElement>('.leaflet-popup-close-button')
                        ?.click();
                      onClaim(z.zone);
                    }}
                    disabled={busyZone === z.zone}
                    className={`mt-1 w-full rounded-md px-2 py-1 text-[11px] font-bold text-white ${
                      busyZone === z.zone
                        ? 'cursor-not-allowed bg-slate-400'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {busyZone === z.zone ? 'Claiming…' : 'Claim Route'}
                  </button>
                )}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* One pin per household pickup, coloured by status */}
        {pickups.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.latitude, p.longitude]}
            // Scales a little with weight so a heavy door reads as one, and
            // turns indigo when that household has actually asked.
            radius={Math.min(11, 6 + p.weightKg)}
            pathOptions={{
              color: '#fff',
              weight: 2,
              fillColor:
                p.status === 'SCHEDULED'
                  ? '#f59e0b'
                  : p.requested
                    ? '#4f46e5'
                    : '#059669',
              fillOpacity: 1,
            }}
          >
            <Popup autoPan keepInView autoPanPadding={[24, 24]} maxWidth={250}>
              <p className="text-sm font-extrabold leading-tight text-slate-900">
                {p.householdName ?? 'Household'}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                <b className="text-sm">{p.weightKg.toFixed(2)} kg</b>
                {p.itemCount ? ` · ${p.itemCount} item${p.itemCount === 1 ? '' : 's'}` : ''}
                {' · '}
                {p.zone}
              </p>
              {p.address && (
                <p className="mt-1 text-xs text-slate-500">{p.address}</p>
              )}

              {/* Every code at this door, so the total on screen always adds
                  up to the number the household sees in their app. */}
              {p.materials && Object.keys(p.materials).length > 0 && (
                <div className="mt-1.5 space-y-px border-t border-slate-100 pt-1.5">
                  {Object.entries(p.materials).map(([mat, kg]) => (
                    <div
                      key={mat}
                      className="flex items-center justify-between gap-2 text-[11px]"
                    >
                      <span
                        className={`rounded px-1.5 py-px font-semibold ${
                          MATERIAL_STYLES[mat] ?? 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {mat}
                      </span>
                      <span className="font-bold text-slate-700">
                        {kg.toFixed(2)} kg
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {p.requested ? 'REQUESTED PICKUP' : p.status}
              </p>
              <button
                onClick={(e) => {
                  (e.currentTarget.closest('.leaflet-popup') as HTMLElement)
                    ?.querySelector<HTMLAnchorElement>('.leaflet-popup-close-button')
                    ?.click();
                  onRoute({ pickupId: p.id });
                }}
                className="mt-2 w-full rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                style={{ background: WAREHOUSE_COLOR }}
              >
                Route to this pickup
              </button>
            </Popup>
          </CircleMarker>
        ))}

        {warehouse && (
          <Marker
            position={[warehouse.latitude, warehouse.longitude]}
            icon={warehouseIcon}
          >
            <Popup autoPan keepInView autoPanPadding={[24, 24]} maxWidth={240}>
              <p className="font-bold text-slate-900">{warehouse.name}</p>
              {warehouse.address && (
                <p className="text-xs text-slate-600">{warehouse.address}</p>
              )}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
