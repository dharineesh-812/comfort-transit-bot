import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, Marker } from "react-leaflet";
import L from "leaflet";
import type { Bus, Route } from "@/lib/transit-data";
import { crowdFromPct } from "@/lib/transit-data";

const busIcon = (color: string) =>
  L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};
      display:grid;place-items:center;
      box-shadow:0 0 0 3px rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.4);
      font-size:14px;
    ">🚌</div>`,
  });

const crowdColor = (pct: number) => {
  const l = crowdFromPct(pct);
  return l === "low" ? "#5ee0a0" : l === "medium" ? "#f4b942" : "#ef5350";
};

export function RouteMap({ route, buses }: { route: Route; buses: Bus[] }) {
  const center: [number, number] = [
    route.stops.reduce((s, x) => s + x.lat, 0) / route.stops.length,
    route.stops.reduce((s, x) => s + x.lng, 0) / route.stops.length,
  ];
  const path: [number, number][] = route.stops.map(s => [s.lat, s.lng]);

  return (
    <MapContainer center={center} zoom={12} className="h-[420px] w-full" key={route.id}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap'
      />
      <Polyline positions={path} pathOptions={{ color: route.color, weight: 5, opacity: 0.7 }} />
      {route.stops.map(s => (
        <CircleMarker
          key={s.id}
          center={[s.lat, s.lng]}
          radius={6}
          pathOptions={{ color: route.color, fillColor: "#0f172a", fillOpacity: 1, weight: 2 }}
        >
          <Tooltip direction="top" offset={[0, -6]}>{s.name}</Tooltip>
        </CircleMarker>
      ))}
      {buses.map(b => (
        <Marker key={b.id} position={[b.lat, b.lng]} icon={busIcon(crowdColor(b.occupancyPct))}>
          <Tooltip direction="top" offset={[0, -14]}>
            <strong>{b.label}</strong> · {b.occupancyPct}% · ETA {b.etaMinutes}m
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
