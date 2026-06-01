import type { CrowdLevel } from "@/lib/transit-data";
import { crowdLabel } from "@/lib/transit-data";

export function CrowdBadge({ level, pct }: { level: CrowdLevel; pct?: number }) {
  const cls = level === "low" ? "crowd-low" : level === "medium" ? "crowd-medium" : "crowd-high";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current pulse-dot" />
      {crowdLabel(level)}
      {pct !== undefined && <span className="opacity-80">· {pct}%</span>}
    </span>
  );
}
