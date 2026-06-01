export type CrowdLevel = "low" | "medium" | "high";

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Route {
  id: string;
  name: string;
  color: string;
  stops: Stop[];
}

export interface Bus {
  id: string;
  routeId: string;
  label: string;
  lat: number;
  lng: number;
  occupancyPct: number; // 0-100
  capacity: number;
  etaMinutes: number;
  speedKmh: number;
  predictedOccupancyNext: number;
}

export const ROUTES: Route[] = [
  {
    id: "R12",
    name: "Route 12 · Downtown ↔ Tech Park",
    color: "#22d3ee",
    stops: [
      { id: "s1", name: "Central Station", lat: 12.9716, lng: 77.5946 },
      { id: "s2", name: "MG Road", lat: 12.9756, lng: 77.6068 },
      { id: "s3", name: "Trinity", lat: 12.9784, lng: 77.6175 },
      { id: "s4", name: "Indiranagar", lat: 12.9784, lng: 77.6408 },
      { id: "s5", name: "Marathahalli", lat: 12.9591, lng: 77.6974 },
      { id: "s6", name: "Tech Park", lat: 12.9352, lng: 77.6917 },
    ],
  },
  {
    id: "R45",
    name: "Route 45 · Airport Express",
    color: "#f59e0b",
    stops: [
      { id: "a1", name: "City Center", lat: 12.9716, lng: 77.5946 },
      { id: "a2", name: "Hebbal", lat: 13.0358, lng: 77.5970 },
      { id: "a3", name: "Yelahanka", lat: 13.1007, lng: 77.5963 },
      { id: "a4", name: "Airport", lat: 13.1986, lng: 77.7066 },
    ],
  },
  {
    id: "R7",
    name: "Route 7 · University Loop",
    color: "#a78bfa",
    stops: [
      { id: "u1", name: "Central Station", lat: 12.9716, lng: 77.5946 },
      { id: "u2", name: "Cubbon Park", lat: 12.9763, lng: 77.5929 },
      { id: "u3", name: "University", lat: 12.9352, lng: 77.5662 },
      { id: "u4", name: "Library Square", lat: 12.9279, lng: 77.5731 },
    ],
  },
];

export function crowdFromPct(pct: number): CrowdLevel {
  if (pct < 50) return "low";
  if (pct < 80) return "medium";
  return "high";
}

export function crowdLabel(level: CrowdLevel) {
  return level === "low" ? "Low" : level === "medium" ? "Medium" : "High";
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Generate live buses for a route deterministically + time-varying
export function generateBuses(route: Route, now: number): Bus[] {
  const buses: Bus[] = [];
  const count = 4;
  for (let i = 0; i < count; i++) {
    const seed = (now / 1000 / 30 + i * 0.27) % 1; // progress along route
    const segIndex = Math.floor(seed * (route.stops.length - 1));
    const segT = seed * (route.stops.length - 1) - segIndex;
    const a = route.stops[segIndex];
    const b = route.stops[Math.min(segIndex + 1, route.stops.length - 1)];
    const lat = lerp(a.lat, b.lat, segT);
    const lng = lerp(a.lng, b.lng, segT);

    // Rush-hour weighting based on local time
    const hour = new Date(now).getHours();
    const rush = hour >= 8 && hour <= 10 ? 0.85 : hour >= 17 && hour <= 20 ? 0.9 : 0.45;
    const noise = ((Math.sin(now / 60000 + i * 1.7) + 1) / 2) * 0.3;
    const occupancyPct = Math.round(Math.min(100, Math.max(10, (rush + noise) * 100 - i * 8)));

    buses.push({
      id: `${route.id}-${i + 1}`,
      routeId: route.id,
      label: `${route.id}-${String(i + 1).padStart(2, "0")}`,
      lat,
      lng,
      occupancyPct,
      capacity: 60,
      etaMinutes: 3 + i * 7 + Math.round(((Math.cos(now / 30000 + i) + 1) / 2) * 4),
      speedKmh: 22 + Math.round(((Math.sin(now / 20000 + i) + 1) / 2) * 18),
      predictedOccupancyNext: Math.round(Math.min(100, Math.max(10, occupancyPct + (i % 2 === 0 ? -15 : 10) + noise * 10))),
    });
  }
  return buses.sort((a, b) => a.etaMinutes - b.etaMinutes);
}

export function recommendBus(buses: Bus[]): { bus: Bus; reason: string } | null {
  if (!buses.length) return null;
  // Score: lower occupancy + reasonable ETA
  const scored = buses.map(b => ({ b, score: b.occupancyPct + b.etaMinutes * 1.5 }));
  scored.sort((x, y) => x.score - y.score);
  const pick = scored[0].b;
  const reason =
    pick.occupancyPct < 50
      ? `Comfortable ride — only ${pick.occupancyPct}% full, arriving in ${pick.etaMinutes} min.`
      : pick.occupancyPct < 80
        ? `Best balance of wait time and space (${pick.occupancyPct}% full, ${pick.etaMinutes} min).`
        : `All buses are crowded right now. ${pick.label} is your fastest option.`;
  return { bus: pick, reason };
}
