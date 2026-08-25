export interface ZoneRoute {
  zone: string;
  totalWeightKg: number;
  userCount: number;
  itemCount: number;
  latitude: number;
  longitude: number;
  breakdown: Record<string, number>;
  /** Households that have pressed "Request pickup" in the app. */
  requestedCount?: number;
  /** Oldest outstanding request in this zone. */
  requestedAt?: string | null;
}

/** "12 minutes" / "3 hours" / "2 days" since a request was made. */
function waitedFor(iso?: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

interface Props {
  route: ZoneRoute;
  onClaim: (zone: string) => void | Promise<void>;
  claiming: boolean;
  /** Flashes when a live socket event lands for this zone. */
  highlight?: boolean;
}

/** Threshold above which a trip is worth driving. */
const PROFITABLE_KG = 2;

const MATERIAL_STYLES: Record<string, string> = {
  'PET 1': 'bg-sky-100 text-sky-800',
  'HDPE 2': 'bg-emerald-100 text-emerald-800',
  'PVC 3': 'bg-rose-100 text-rose-800',
  'LDPE 4': 'bg-amber-100 text-amber-800',
  'PP 5': 'bg-violet-100 text-violet-800',
  'PS 6': 'bg-orange-100 text-orange-800',
  'OTHER 7': 'bg-slate-200 text-slate-700',
};

export default function ZoneCard({ route, onClaim, claiming, highlight }: Props) {
  const profitable = route.totalWeightKg >= PROFITABLE_KG;
  const requested = route.requestedCount ?? 0;

  return (
    <div
      className={`card-hover soft-card flex flex-col ${
        highlight ? 'ring-2 ring-sky-300' : ''
      } ${requested > 0 ? 'ring-2 ring-[#c7d2fe]' : ''}`}
    >
      <div className="flex items-start justify-between px-6 pt-6">
        <div>
          <h3 className="text-xl font-extrabold text-[#0b1f14]">
            {route.zone}
          </h3>
          <p className="mt-1 text-sm text-[#6b7b72]">
            {route.itemCount} item{route.itemCount === 1 ? '' : 's'} waiting
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-[11.5px] font-bold ${
            profitable
              ? 'bg-[#e6f7ef] text-[#065f46]'
              : 'bg-[#f0f3f1] text-[#9aa8a1]'
          }`}
        >
          {profitable ? 'Worth the trip' : 'Still filling'}
        </span>
      </div>

      {/* A household actively asking outranks a merely heavy zone — this is
          the difference between guessing a route and serving a request. */}
      {requested > 0 && (
        <div className="mx-6 mt-4 flex items-center gap-2.5 rounded-2xl bg-[#eef0ff] px-4 py-2.5">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[#4f46e5]">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 10.6V6h-2v7.4l5.3 3.1 1-1.7-4.3-2.2z" />
            </svg>
          </span>
          <p className="text-[12.5px] font-bold text-[#4f46e5]">
            {requested} household{requested === 1 ? '' : 's'} asked for pickup
            {route.requestedAt && (
              <span className="font-semibold text-[#6366f1]">
                {' '}· waiting {waitedFor(route.requestedAt)}
              </span>
            )}
          </p>
        </div>
      )}

      <div className="flex items-end gap-7 px-6 pt-6">
        <div>
          <p className="tabular text-[46px] font-extrabold leading-none text-[#0b1f14]">
            {route.totalWeightKg.toFixed(1)}
            <span className="ml-1.5 text-lg font-bold text-[#9aa8a1]">kg</span>
          </p>
          <p className="mt-2 text-[11.5px] text-[#9aa8a1]">Aggregated</p>
        </div>
        <div className="border-l border-[#e6ebe8] pl-7">
          <p className="tabular text-3xl font-extrabold leading-none text-[#0b1f14]">
            {route.userCount}
          </p>
          <p className="mt-2 text-[11.5px] text-[#9aa8a1]">
            Household{route.userCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-6 pt-5">
        {Object.entries(route.breakdown)
          .sort((a, b) => b[1] - a[1])
          .map(([material, kg]) => (
            <span
              key={material}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                MATERIAL_STYLES[material] ?? 'bg-[#f0f3f1] text-[#6b7b72]'
              }`}
            >
              {material}: {kg.toFixed(1)}kg
            </span>
          ))}
      </div>

      <div className="mt-auto p-6 pt-6">
        <button
          onClick={() => onClaim(route.zone)}
          disabled={claiming}
          className={`w-full rounded-2xl px-4 py-3.5 text-sm font-bold text-white transition
            ${
              claiming
                ? 'cursor-not-allowed bg-[#c8d2cd]'
                : 'bg-[#059669] shadow-[0_10px_22px_-10px_rgba(5,150,105,0.9)] hover:bg-[#047857]'
            }`}
        >
          {claiming ? 'Claiming route…' : 'Claim route'}
        </button>
        <p className="mt-2.5 text-center text-[11.5px] text-[#9aa8a1]">
          Schedules all {route.userCount} household
          {route.userCount === 1 ? '' : 's'} at once
        </p>
      </div>
    </div>
  );
}
