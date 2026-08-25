import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import ZoneCard, { type ZoneRoute } from './components/ZoneCard';
import RouteMap, { type Pickup, type Warehouse, type RouteResult } from './components/RouteMap';
import Login, { type VendorSession } from './components/Login';

const API_BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000';

const SESSION_KEY = 'nirvaha_vendor_session';

/** ngrok's free tier serves an interstitial without this header. */
const HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

type Tab = 'available' | 'scheduled' | 'history';

interface Household {
  name: string;
  address?: string | null;
  itemCount: number;
  weightKg: number;
  materials: Record<string, number>;
}

interface ClaimedRoute {
  zone: string;
  totalWeightKg: number;
  userCount: number;
  scheduledFor?: string | null;
  collectedOn?: string | null;
  breakdown?: Record<string, number>;
  households?: Household[];
}

const MATERIAL_PILL: Record<string, string> = {
  'PET 1': 'bg-sky-100 text-sky-800',
  'HDPE 2': 'bg-emerald-100 text-emerald-800',
  'PVC 3': 'bg-rose-100 text-rose-800',
  'LDPE 4': 'bg-amber-100 text-amber-800',
  'PP 5': 'bg-violet-100 text-violet-800',
  'PS 6': 'bg-orange-100 text-orange-800',
  'OTHER 7': 'bg-slate-200 text-slate-700',
};

export default function App() {
  const [session, setSession] = useState<VendorSession | null>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as VendorSession) : null;
    } catch {
      return null;
    }
  });

  const [tab, setTab] = useState<Tab>('available');
  const [routes, setRoutes] = useState<ZoneRoute[]>([]);
  const [claimed, setClaimed] = useState<ClaimedRoute[]>([]);
  const [history, setHistory] = useState<ClaimedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyZone, setBusyZone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [pulse, setPulse] = useState<string | null>(null);
  const [request, setRequest] = useState<string | null>(null);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routing, setRouting] = useState(false);

  const vendorId = session?.id ?? '';
  const socketRef = useRef<Socket | null>(null);

  const handleLogin = (s: VendorSession) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
  };

  /** Revoke the token server-side, then drop the local session. */
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { ...HEADERS, Authorization: `Bearer ${session?.token ?? ''}` },
      });
    } catch {
      // A failed revoke must not trap the vendor in a session they left.
    }
    localStorage.removeItem(SESSION_KEY);
    socketRef.current?.disconnect();
    setSession(null);
  };

  // Errors used to stay on screen forever; auto-dismiss so a transient blip
  // does not look like a permanently broken dashboard during a demo.
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 8000);
    return () => clearTimeout(t);
  }, [error]);

  const load = useCallback(async () => {
    if (!vendorId) return;
    try {
      setError(null);
      const [r, c, h, m] = await Promise.all([
        fetch(`${API_BASE_URL}/api/vendor/routes`, { headers: HEADERS }),
        fetch(`${API_BASE_URL}/api/vendor/claimed/${vendorId}`, { headers: HEADERS }),
        fetch(`${API_BASE_URL}/api/vendor/history/${vendorId}`, { headers: HEADERS }),
        fetch(`${API_BASE_URL}/api/vendor/map/${vendorId}`, { headers: HEADERS }),
      ]);
      if (!r.ok) throw new Error(`Routes request failed (${r.status})`);
      setRoutes(await r.json());
      setClaimed(c.ok ? await c.json() : []);
      setHistory(h.ok ? await h.json() : []);
      if (m.ok) {
        const md = await m.json();
        setPickups(md.pickups ?? []);
        setWarehouse(md.warehouse ?? null);
      }
    } catch (e: any) {
      setError(e?.message || 'Connection lost. Retrying automatically.');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  // Realtime: the backend pushes on every bin add / claim / collect, so the
  // board updates itself while a household is still standing at their bin.
  useEffect(() => {
    if (!vendorId) return;
    load();

    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
    });
    socketRef.current = socket;

    socket.on('connect', () => setLive(true));
    socket.on('disconnect', () => setLive(false));
    socket.on('connect_error', () => setLive(false));

    socket.on('bin:updated', (p: { zone: string; weightGrams: number }) => {
      setPulse(p.zone);
      setTimeout(() => setPulse(null), 2000);
      load();
    });

    // A household pressed "Request pickup". Louder than a bin top-up and it
    // stays up longer, because someone is now waiting on an answer.
    socket.on(
      'pickup:requested',
      (p: { zone: string; weightGrams: number; itemCount: number }) => {
        setRequest(
          `${p.zone} — a household asked for pickup ` +
            `(${(p.weightGrams / 1000).toFixed(2)} kg, ${p.itemCount} item${
              p.itemCount === 1 ? '' : 's'
            })`,
        );
        setTimeout(() => setRequest(null), 12000);
        load();
      },
    );

    socket.on('route:claimed', () => load());
    socket.on('route:collected', () => load());

    // Fallback only — if the socket drops, the board still refreshes slowly.
    const id = setInterval(() => {
      if (!socketRef.current?.connected) load();
    }, 20000);

    return () => {
      clearInterval(id);
      socket.disconnect();
    };
  }, [load, vendorId]);

  const post = async (path: string, zone: string, okMsg: (d: any) => string) => {
    setBusyZone(zone);
    try {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ zone, vendorId: vendorId }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setToast(okMsg(data));
      // The zone this route pointed at has changed state, so a stale violet
      // line would still be drawn to a place that is no longer actionable.
      setRoute((r) => (r && r.label === zone ? null : r));
      await load();
      setTimeout(() => setToast(null), 6000);
    } catch (e: any) {
      setError(e?.message || 'Action failed.');
    } finally {
      setBusyZone(null);
    }
  };

  const claimRoute = (zone: string) =>
    post('/api/vendor/claim-route', zone, (d) =>
      `${zone} claimed — ${d.householdsNotified} household(s) scheduled for pickup tomorrow.`,
    );

  const completeRoute = (zone: string) =>
    post('/api/vendor/complete-route', zone, () => `${zone} marked collected.`);

  /** Draw the road route from the warehouse to a zone or a single pickup. */
  const showRoute = async (opts: { zone?: string; pickupId?: string }) => {
    setRouting(true);
    try {
      const q = opts.pickupId
        ? `pickupId=${encodeURIComponent(opts.pickupId)}`
        : `zone=${encodeURIComponent(opts.zone ?? '')}`;
      const res = await fetch(
        `${API_BASE_URL}/api/vendor/route/${vendorId}?${q}`,
        { headers: HEADERS },
      );
      if (!res.ok) throw new Error(`Route failed (${res.status})`);
      const data = await res.json();
      if (data?.ok) setRoute({ ...data, zone: opts.zone, pickupId: opts.pickupId });
      else setError(data?.message || 'No route available.');
    } catch (e: any) {
      setError(e?.message || 'Could not calculate a route.');
    } finally {
      setRouting(false);
    }
  };

  const [pickingUp, setPickingUp] = useState(false);

  /**
   * "Picked up" from the route bar. A zone must be claimed before it can be
   * collected, so claim-then-complete runs in one action and the map clears.
   */
  const markPickedUp = async (r: RouteResult) => {
    setPickingUp(true);
    try {
      let data: any;

      if (r.pickupId) {
        // A single household. Collecting the whole zone here would wrongly
        // mark neighbours as collected when only one door was visited.
        const res = await fetch(`${API_BASE_URL}/api/vendor/complete-pickup`, {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify({ pickupId: r.pickupId, vendorId: vendorId }),
        });
        if (!res.ok) throw new Error(`Could not complete (${res.status})`);
        data = await res.json();
      } else {
        // `label` is a display string like "HDPE 2 · RS Puram" and is NOT a
        // valid zone — always use the zone the backend resolved.
        const zone = r.zone;
        if (!zone) throw new Error('This route has no zone to collect.');

        await fetch(`${API_BASE_URL}/api/vendor/claim-route`, {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify({ zone, vendorId: vendorId }),
        });
        const res = await fetch(`${API_BASE_URL}/api/vendor/complete-route`, {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify({ zone, vendorId: vendorId }),
        });
        if (!res.ok) throw new Error(`Could not complete (${res.status})`);
        data = await res.json();
      }

      // A silent zero here is what made this look like it worked when it had
      // not — surface it instead.
      if (!data || data.updatedCount === 0) {
        throw new Error(
          'Nothing was collected — it may already be marked collected.',
        );
      }

      setRoute(null);
      setToast(
        `${data.zone ?? r.zone ?? r.label} collected — households notified.`,
      );
      await load();
      setTab('history');
      setTimeout(() => setToast(null), 6000);
    } catch (e: any) {
      setError(e?.message || 'Could not mark as picked up.');
    } finally {
      setPickingUp(false);
    }
  };

  /**
   * Rebuilding this inline made every CircleMarker unmount and remount on each
   * render. Clicking a button inside an open Popup then destroyed the popup
   * mid-event and took the whole tree down with it (blank page). Memoising
   * keeps marker identity stable across renders.
   */
  const mapZones = useMemo(() => {
    const pending = routes
      .filter((r) => r.latitude && r.longitude)
      .map((r) => ({
        zone: r.zone,
        latitude: r.latitude,
        longitude: r.longitude,
        totalWeightKg: r.totalWeightKg,
        userCount: r.userCount,
        breakdown: r.breakdown,
        itemCount: r.itemCount,
        requestedCount: r.requestedCount ?? 0,
        scheduled: false,
      }));

    // Claimed zones leave /vendor/routes, so without this a scheduled route
    // would vanish from the map and could not be navigated to.
    const acc: Record<string, any> = {};
    for (const p of pickups) {
      if (p.status !== 'SCHEDULED') continue;
      const a = (acc[p.zone] ??= {
        zone: p.zone,
        latitude: 0,
        longitude: 0,
        totalWeightKg: 0,
        breakdown: {} as Record<string, number>,
        n: 0,
      });
      a.latitude += p.latitude;
      a.longitude += p.longitude;
      a.totalWeightKg += p.weightKg;
      a.breakdown[p.materialType] = +(
        (a.breakdown[p.materialType] || 0) + p.weightKg
      ).toFixed(2);
      a.n += 1;
    }

    const scheduled = Object.values(acc).map((a: any) => ({
      zone: a.zone,
      latitude: a.latitude / a.n,
      longitude: a.longitude / a.n,
      totalWeightKg: +a.totalWeightKg.toFixed(2),
      userCount: a.n,
      breakdown: a.breakdown,
      itemCount: a.n,
      scheduled: true,
    }));

    return [...pending, ...scheduled];
  }, [routes, pickups]);

  const totalKg = routes.reduce((s, r) => s + r.totalWeightKg, 0);
  const totalHouseholds = routes.reduce((s, r) => s + r.userCount, 0);
  const totalRequests = routes.reduce(
    (s, r) => s + (r.requestedCount ?? 0),
    0,
  );

  const NAV: { key: Tab; label: string; count: number }[] = [
    { key: 'available', label: 'Available Routes', count: routes.length },
    { key: 'scheduled', label: 'Scheduled', count: claimed.length },
    { key: 'history', label: 'Collection History', count: history.length },
  ];

  if (!session) {
    return (
      <Login apiBaseUrl={API_BASE_URL} headers={HEADERS} onLogin={handleLogin} />
    );
  }

  const initials = (session.displayName || 'V')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex min-h-screen bg-[#f4f6f5] font-sans text-[#0b1f14]">
      {/* Sidebar */}
      <aside className="hidden w-[264px] shrink-0 flex-col border-r border-[#e6ebe8] bg-white p-6 md:flex">
        <div className="mb-9 flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Nirvaha"
            className="h-11 w-11 rounded-full object-cover shadow-sm"
          />
          <div>
            <h1 className="text-[17px] font-extrabold text-[#0b1f14]">
              Nirvaha
            </h1>
            <p className="text-xs text-[#6b7b72]">Collection partner</p>
          </div>
        </div>

        <nav className="space-y-1.5 text-sm">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition
                ${
                  tab === n.key
                    ? 'bg-[#e6f7ef] font-bold text-[#065f46]'
                    : 'font-medium text-[#6b7b72] hover:bg-[#f4f6f5] hover:text-[#0b1f14]'
                }`}
            >
              <span>{n.label}</span>
              <span
                className={`tabular ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${
                  tab === n.key
                    ? 'bg-white text-[#047857]'
                    : 'bg-[#f0f3f1] text-[#9aa8a1]'
                }`}
              >
                {n.count}
              </span>
            </button>
          ))}
        </nav>

        <div className="mt-8 rounded-3xl bg-gradient-to-br from-[#059669] to-[#065f46] p-5 text-white shadow-[0_14px_30px_-12px_rgba(6,95,70,0.6)]">
          <p className="text-xs font-medium text-white/70">
            Waiting across all zones
          </p>
          <p className="tabular mt-1.5 text-3xl font-extrabold leading-none">
            {totalKg.toFixed(1)}
            <span className="ml-1 text-base font-bold text-white/60">kg</span>
          </p>
          <p className="mt-1.5 text-xs text-white/70">
            {totalHouseholds} household{totalHouseholds === 1 ? '' : 's'}
          </p>
        </div>

        <div className="mt-auto pt-6">
          <div className="mb-4 flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                live ? 'animate-pulse bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="text-[11px] text-[#9aa8a1]">
              {live ? 'Updating live' : 'Reconnecting'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#059669] to-[#065f46] text-[13px] font-extrabold text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#0b1f14]">
                {session.displayName}
              </p>
              <p className="truncate text-xs text-[#9aa8a1]">Coimbatore</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-4 w-full rounded-2xl border border-[#e6ebe8] px-3 py-2.5 text-xs font-bold text-[#6b7b72] transition hover:bg-[#f4f6f5] hover:text-[#0b1f14]"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-[#6b7b72]">
              {greeting()}
              {session.displayName ? `, ${session.displayName.split(' ')[0]}` : ''}
            </p>
            <h2 className="mt-0.5 text-[32px] font-extrabold leading-tight text-[#0b1f14]">
              {NAV.find((n) => n.key === tab)?.label}
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#6b7b72]">
              {tab === 'available' &&
                'Households aggregated by neighbourhood. Claim a zone to schedule every household in it at once.'}
              {tab === 'scheduled' &&
                'Routes you have claimed. Mark them collected once the truck has been.'}
              {tab === 'history' && 'Zones you have already collected.'}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {!live && (
              <span className="flex items-center gap-2 rounded-full bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Reconnecting
              </span>
            )}
            {tab === 'available' && (
              <button
                onClick={() => setShowMap((v) => !v)}
                className="rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-[#6b7b72] shadow-[0_4px_12px_-2px_rgba(11,31,20,0.08)] transition hover:text-[#0b1f14]"
              >
                {showMap ? 'Hide map' : 'Show map'}
              </button>
            )}
            <button
              onClick={load}
              className="rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-[#6b7b72] shadow-[0_4px_12px_-2px_rgba(11,31,20,0.08)] transition hover:text-[#0b1f14]"
            >
              Refresh
            </button>
          </div>
        </header>

        {/* Figures first — the shape of tonight's work in one glance. */}
        <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Waiting"
            value={totalKg.toFixed(1)}
            unit="kg"
            footer="Across every zone"
            tone="brand"
          />
          <Stat
            label="Households"
            value={`${totalHouseholds}`}
            unit=""
            footer="Bins ready to collect"
            tone="indigo"
          />
          <Stat
            label="Asked for pickup"
            value={`${totalRequests}`}
            unit=""
            footer={
              totalRequests === 0
                ? `${routes.length} zone${routes.length === 1 ? '' : 's'} claimable`
                : 'Households waiting on you'
            }
            tone={totalRequests > 0 ? 'indigo' : 'amber'}
          />
          <Stat
            label="Collected"
            value={history
              .reduce((s, h) => s + h.totalWeightKg, 0)
              .toFixed(1)}
            unit="kg"
            footer={`${history.length} completed route${
              history.length === 1 ? '' : 's'
            }`}
            tone="brand"
          />
        </div>

        {routing && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-violet-50 px-5 py-3.5 text-sm font-bold text-violet-800 ring-1 ring-violet-100">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-300 border-t-violet-700" />
            Finding the best route…
          </div>
        )}
        {toast && (
          <div className="mb-6 rounded-2xl bg-[#e6f7ef] px-5 py-3.5 text-sm font-bold text-[#065f46] ring-1 ring-emerald-100">
            {toast}
          </div>
        )}
        {request && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-[#eef0ff] px-5 py-3.5 text-sm font-bold text-[#4f46e5] ring-1 ring-indigo-100">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-indigo-500" />
            </span>
            {request}
          </div>
        )}
        {pulse && (
          <div className="mb-6 rounded-2xl bg-sky-50 px-5 py-3.5 text-sm font-bold text-sky-800 ring-1 ring-sky-100">
            New plastic added in {pulse}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-2xl bg-rose-50 px-5 py-3.5 text-sm text-rose-800 ring-1 ring-rose-100">
            <span className="font-bold">Can't reach Nirvaha.</span> {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="soft-card h-64 animate-pulse bg-white/70"
              />
            ))}
          </div>
        ) : tab === 'available' ? (
          routes.length === 0 ? (
            <Empty
              title="No zones have reached profitable pickup thresholds."
              sub="Zones appear here as households fill their Digital Bins."
            />
          ) : (
            <>
              {showMap && (
                <div className="mb-6">
                  <RouteMap
                    zones={mapZones}
                    pickups={pickups}
                    warehouse={warehouse}
                    onClaim={claimRoute}
                    busyZone={busyZone}
                    onRoute={showRoute}
                    route={route}
                    onClearRoute={() => setRoute(null)}
                    onPickedUp={markPickedUp}
                    pickingUp={pickingUp}
                  />
                </div>
              )}
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {routes.map((r) => (
                <ZoneCard
                  key={r.zone}
                  route={r}
                  onClaim={claimRoute}
                  claiming={busyZone === r.zone}
                  highlight={pulse === r.zone}
                />
              ))}
            </div>
            </>
          )
        ) : tab === 'scheduled' ? (
          claimed.length === 0 ? (
            <Empty title="No scheduled routes." sub="Claim a zone to see it here." />
          ) : (
            <RouteTable
              rows={claimed}
              dateLabel="Scheduled"
              dateKey="scheduledFor"
              action={{ label: 'Mark Collected', onClick: completeRoute, busyZone }}
            />
          )
        ) : history.length === 0 ? (
          <Empty title="No collections yet." sub="Completed routes are archived here." />
        ) : (
          <RouteTable rows={history} dateLabel="Collected" dateKey="collectedOn" />
        )}
      </main>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const STAT_TONES: Record<string, string> = {
  brand: 'bg-[#e6f7ef] text-[#047857]',
  indigo: 'bg-[#eef0ff] text-[#4f46e5]',
  amber: 'bg-amber-100 text-amber-700',
};

/** One figure, its unit, and the line that gives it meaning. */
function Stat({
  label,
  value,
  unit,
  footer,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  footer: string;
  tone: keyof typeof STAT_TONES;
}) {
  return (
    <div className="soft-card px-5 pb-4 pt-4">
      <div className="flex items-center gap-2.5">
        <span
          className={`h-2.5 w-2.5 rounded-full ${STAT_TONES[tone]}`}
          aria-hidden
        />
        <span className="text-[12.5px] font-semibold text-[#6b7b72]">
          {label}
        </span>
      </div>
      <p className="tabular mt-3.5 text-[30px] font-extrabold leading-none text-[#0b1f14]">
        {value}
        {unit && (
          <span className="ml-1 text-[13px] font-semibold text-[#9aa8a1]">
            {unit}
          </span>
        )}
      </p>
      <div className="mt-3 border-t border-[#e6ebe8] pt-2.5">
        <p className="text-[11.5px] text-[#9aa8a1]">{footer}</p>
      </div>
    </div>
  );
}

function Empty({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="soft-card p-16 text-center">
      <p className="text-lg font-bold text-[#0b1f14]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#6b7b72]">
        {sub}
      </p>
    </div>
  );
}

function RouteTable({
  rows,
  dateLabel,
  dateKey,
  action,
}: {
  rows: ClaimedRoute[];
  dateLabel: string;
  dateKey: 'scheduledFor' | 'collectedOn';
  action?: {
    label: string;
    onClick: (zone: string) => void;
    busyZone: string | null;
  };
}) {
  // Which zone's household breakdown is expanded.
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="soft-card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[#e6ebe8] text-[11px] font-bold uppercase tracking-wider text-[#9aa8a1]">
          <tr>
            <th className="px-6 py-4">Zone</th>
            <th className="px-6 py-4">Weight</th>
            <th className="px-6 py-4">Households</th>
            <th className="px-6 py-4">{dateLabel}</th>
            {action && <th className="px-6 py-4" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f3f1]">
          {rows.map((c) => (
            <Fragment key={c.zone}>
              <tr
                className="cursor-pointer transition hover:bg-[#f8faf9]"
                onClick={() => setOpen(open === c.zone ? null : c.zone)}
              >
                <td className="px-6 py-4 font-bold text-[#0b1f14]">
                  <span className="mr-2.5 inline-block w-3 text-[#9aa8a1]">
                    {open === c.zone ? '▾' : '▸'}
                  </span>
                  {c.zone}
                </td>
                <td className="tabular px-6 py-4 font-semibold text-[#0b1f14]">
                  {c.totalWeightKg.toFixed(1)} kg
                </td>
                <td className="tabular px-6 py-4 text-[#6b7b72]">
                  {c.userCount}
                </td>
                <td className="px-6 py-4 text-[#6b7b72]">
                  {c[dateKey]
                    ? new Date(c[dateKey] as string).toLocaleDateString()
                    : 'Tomorrow'}
                </td>
                {action && (
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick(c.zone);
                      }}
                      disabled={action.busyZone === c.zone}
                      className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition ${
                        action.busyZone === c.zone
                          ? 'cursor-not-allowed bg-[#c8d2cd]'
                          : 'bg-[#059669] hover:bg-[#047857]'
                      }`}
                    >
                      {action.busyZone === c.zone ? 'Saving…' : action.label}
                    </button>
                  </td>
                )}
              </tr>

              {open === c.zone && (
                <tr className="bg-[#f8faf9]">
                  <td colSpan={action ? 5 : 4} className="px-6 py-5">
                    {c.breakdown && Object.keys(c.breakdown).length > 0 && (
                      <div className="mb-5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#9aa8a1]">
                          Materials collected
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {Object.entries(c.breakdown).map(([m, kg]) => (
                            <span
                              key={m}
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                MATERIAL_PILL[m] ?? 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {m}: {kg.toFixed(2)} kg
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#9aa8a1]">
                      Households
                    </p>
                    <div className="mt-2.5 space-y-2.5">
                      {(c.households ?? []).map((h) => (
                        <div
                          key={h.name}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-3.5 shadow-[0_2px_8px_-2px_rgba(11,31,20,0.06)]"
                        >
                          <div>
                            <p className="text-sm font-bold text-[#0b1f14]">
                              {h.name}
                            </p>
                            {h.address && (
                              <p className="text-xs text-[#9aa8a1]">
                                {h.address}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {Object.entries(h.materials).map(([m, kg]) => (
                              <span
                                key={m}
                                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                  MATERIAL_PILL[m] ?? 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {m} {kg.toFixed(2)}kg
                              </span>
                            ))}
                            <span className="tabular ml-1 text-sm font-extrabold text-[#0b1f14]">
                              {h.weightKg.toFixed(2)} kg
                            </span>
                            <span className="text-xs text-[#9aa8a1]">
                              ({h.itemCount} item{h.itemCount === 1 ? '' : 's'})
                            </span>
                          </div>
                        </div>
                      ))}
                      {(c.households ?? []).length === 0 && (
                        <p className="text-sm text-[#6b7b72]">
                          No household detail available.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
