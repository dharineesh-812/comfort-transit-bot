import type { Bus } from "@/lib/transit-data";
import { crowdFromPct } from "@/lib/transit-data";
import { CrowdBadge } from "./CrowdBadge";
import { Bus as BusIcon, Clock, Gauge, TrendingDown, TrendingUp } from "lucide-react";

export function BusCard({ bus, highlight }: { bus: Bus; highlight?: boolean }) {
  const level = crowdFromPct(bus.occupancyPct);
  const nextLevel = crowdFromPct(bus.predictedOccupancyNext);
  const trendBetter = bus.predictedOccupancyNext < bus.occupancyPct;

  return (
    <div
      className={`rounded-xl border bg-gradient-card p-4 transition-all hover:border-primary/50 ${
        highlight ? "border-primary shadow-glow" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary">
            <BusIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">{bus.label}</div>
            <div className="text-xs text-muted-foreground">
              {bus.speedKmh} km/h · {bus.capacity} seats
            </div>
          </div>
        </div>
        <CrowdBadge level={level} pct={bus.occupancyPct} />
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full transition-all ${level === "low" ? "crowd-low" : level === "medium" ? "crowd-medium" : "crowd-high"}`}
          style={{ width: `${bus.occupancyPct}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <Stat icon={<Clock className="h-4 w-4" />} label="ETA" value={`${bus.etaMinutes} min`} />
        <Stat icon={<Gauge className="h-4 w-4" />} label="Now" value={`${bus.occupancyPct}%`} />
        <Stat
          icon={trendBetter ? <TrendingDown className="h-4 w-4 text-crowd-low" /> : <TrendingUp className="h-4 w-4 text-crowd-high" />}
          label="Next stop"
          value={`${bus.predictedOccupancyNext}%`}
          valueClass={`text-crowd-${nextLevel}`}
        />
      </div>

      {highlight && (
        <div className="mt-3 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
          ✨ AI Recommendation: best choice right now
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, valueClass }: { icon: React.ReactNode; label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-0.5 font-semibold ${valueClass ?? ""}`}>{value}</div>
    </div>
  );
}
