import { useEffect, useMemo, useState } from "react";
import { ROUTES, generateBuses, recommendBus, crowdFromPct } from "@/lib/transit-data";
import { BusCard } from "./BusCard";
import { RouteMap } from "./RouteMap";
import { Chatbot } from "./Chatbot";
import { Activity, Bus, MapPin, Sparkles, TrendingUp, Users } from "lucide-react";

export function Dashboard() {
  const [routeId, setRouteId] = useState(ROUTES[0].id);
  const route = ROUTES.find(r => r.id === routeId)!;

  const [fromStop, setFromStop] = useState(route.stops[0].id);
  const [toStop, setToStop] = useState(route.stops[route.stops.length - 1].id);

  // tick every 5s for "live" feel
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  const buses = useMemo(() => generateBuses(route, now), [route, now]);
  const recommendation = useMemo(() => recommendBus(buses), [buses]);

  // Reset stops when route changes
  useEffect(() => {
    setFromStop(route.stops[0].id);
    setToStop(route.stops[route.stops.length - 1].id);
  }, [route]);

  const avgOccupancy = Math.round(buses.reduce((s, b) => s + b.occupancyPct, 0) / Math.max(1, buses.length));
  const activeBuses = buses.length;
  const nextEta = buses[0]?.etaMinutes ?? 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-gradient-hero">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold leading-tight">TransitMind</h1>
              <p className="text-xs text-muted-foreground">Smart crowd monitoring & recommendations</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
            <span className="h-2 w-2 rounded-full bg-crowd-low pulse-dot" />
            <span className="text-muted-foreground">Live · updated {new Date(now).toLocaleTimeString()}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {/* Route picker + stops */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Route">
              <select
                value={routeId}
                onChange={e => setRouteId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                {ROUTES.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </Field>
            <Field label="From">
              <select
                value={fromStop}
                onChange={e => setFromStop(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                {route.stops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="To">
              <select
                value={toStop}
                onChange={e => setToStop(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                {route.stops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Bus className="h-4 w-4" />} label="Active buses" value={`${activeBuses}`} />
          <StatCard icon={<Users className="h-4 w-4" />} label="Avg occupancy" value={`${avgOccupancy}%`} accent={crowdFromPct(avgOccupancy)} />
          <StatCard icon={<Activity className="h-4 w-4" />} label="Next bus ETA" value={`${nextEta} min`} />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="ML prediction" value="Improving" hint="Next 3 buses trending lighter" />
        </section>

        {/* Recommendation banner */}
        {recommendation && (
          <section className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="font-display text-sm font-semibold text-primary">AI Recommendation · {recommendation.bus.label}</div>
              <p className="mt-0.5 text-sm text-foreground/90">{recommendation.reason}</p>
            </div>
          </section>
        )}

        {/* Map + Buses */}
        <section className="grid gap-6 lg:grid-cols-5">
          <div className="rounded-2xl border border-border bg-card p-4 lg:col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">Live Map</h2>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <Legend color="var(--crowd-low)" label="Low" />
                <Legend color="var(--crowd-medium)" label="Medium" />
                <Legend color="var(--crowd-high)" label="High" />
              </div>
            </div>
            <RouteMap route={route} buses={buses} />
          </div>

          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">Upcoming buses</h2>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {route.stops.find(s => s.id === fromStop)?.name}
              </span>
            </div>
            <div className="space-y-3">
              {buses.map(b => (
                <BusCard key={b.id} bus={b} highlight={recommendation?.bus.id === b.id} />
              ))}
            </div>
          </div>
        </section>

        <footer className="pt-4 pb-8 text-center text-xs text-muted-foreground">
          Powered by IoT sensors, passenger counters & ML occupancy prediction · Demo data
        </footer>
      </main>

      <Chatbot route={route} buses={buses} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function StatCard({
  icon, label, value, hint, accent,
}: { icon: React.ReactNode; label: string; value: string; hint?: string; accent?: "low" | "medium" | "high" }) {
  const accentCls = accent ? `text-crowd-${accent}` : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-2 font-display text-2xl font-bold ${accentCls}`}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
