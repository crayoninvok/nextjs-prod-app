import {
  Row,
  NormalizedRow,
  CombinedVehicleRow,
  TrendPoint,
  Summary,
} from "@/types/types";

export function toSeconds(duration?: string): number {
  if (!duration) return 0;
  const parts = duration.split(":");
  if (parts.length < 3) return 0;
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  const s = Number(parts[2].split(".")[0]) || 0;
  return h * 3600 + m * 60 + s;
}

export function computeAll(rows: Row[]): {
  vehicles: CombinedVehicleRow[];
  normalizedRows: NormalizedRow[]; // ADD THIS TO RETURN TYPE
  trend: TrendPoint[];
  summary: Summary;
} {
  // Group rows by vehicle_name first
  const byVehicleRaw = new Map<string, Row[]>();
  for (const r of rows) {
    const vname = String(r.vehicle_name ?? "UNKNOWN");
    if (!byVehicleRaw.has(vname)) byVehicleRaw.set(vname, []);
    byVehicleRaw.get(vname)!.push(r);
  }

  // Forward fill operator_name within each vehicle group
  const rowsWithOperator: Row[] = [];
  byVehicleRaw.forEach((vehicleRows) => {
    const filled = [...vehicleRows];
    for (let i = filled.length - 1; i >= 0; i--) {
      if (
        !filled[i].operator_name ||
        String(filled[i].operator_name).trim() === ""
      ) {
        // Look ahead for next non-blank operator in SAME vehicle
        for (let j = i + 1; j < filled.length; j++) {
          const nextOp = filled[j].operator_name;
          if (nextOp && String(nextOp).trim() !== "") {
            filled[i].operator_name = nextOp;
            break;
          }
        }
      }
    }
    rowsWithOperator.push(...filled);
  });

  const norm: NormalizedRow[] = rowsWithOperator.map((r) => ({
    ...r,
    status: String(r.status ?? "")
      .trim()
      .toUpperCase(),
    date: r.date ? new Date(r.date).toISOString().slice(0, 10) : undefined,
    duration_sec: toSeconds(r.duration),
    option: String(r.option ?? "").trim(),
    operator_name: r.operator_name ? String(r.operator_name).trim() : undefined,
  }));

  console.log(
    "Sample normalized rows with operator:",
    norm.slice(0, 5).map((r) => ({
      vehicle: r.vehicle_name,
      operator: r.operator_name,
      status: r.status,
    }))
  );

  const byVehicleMap = new Map<string, NormalizedRow[]>();
  for (const r of norm) {
    const key = String(r.vehicle_name ?? "UNKNOWN");
    if (!byVehicleMap.has(key)) byVehicleMap.set(key, []);
    byVehicleMap.get(key)!.push(r);
  }

  const vehicles: CombinedVehicleRow[] = Array.from(byVehicleMap.entries())
    .map(([vehicle_name, sub]) => {
      // Use most frequent operator for this vehicle
      const operatorCounts = new Map<string, number>();
      sub.forEach((r) => {
        const op = r.operator_name || "UNASSIGNED";
        operatorCounts.set(op, (operatorCounts.get(op) || 0) + 1);
      });
      let operator: string | undefined = undefined;
      let maxCount = 0;
      operatorCounts.forEach((count, op) => {
        if (op !== "UNASSIGNED" && count > maxCount) {
          maxCount = count;
          operator = op;
        }
      });

      const ready = sub
        .filter((r) => r.status === "READY")
        .reduce((a, b) => a + b.duration_sec, 0);
      const delay = sub
        .filter((r) => r.status === "DELAY")
        .reduce((a, b) => a + b.duration_sec, 0);
      const idle = sub
        .filter((r) => r.status === "IDLE")
        .reduce((a, b) => a + b.duration_sec, 0);
      const breakdown = sub
        .filter((r) => r.status === "BREAKDOWN")
        .reduce((a, b) => a + b.duration_sec, 0);

      const delayIdle = delay + idle;
      const mohh = ready + delayIdle + breakdown;

      const pa = mohh > 0 ? ((mohh - breakdown) / mohh) * 100 : 0;
      const ua =
        mohh - breakdown > 0
          ? ((mohh - breakdown - delayIdle) / (mohh - breakdown)) * 100
          : 0;
      const efficiency = (pa * ua) / 100;

      return {
        vehicle_name,
        operator,
        breakdown_hours: breakdown / 3600,
        delay_hours: delay / 3600,
        idle_hours: idle / 3600,
        delay_idle_hours: delayIdle / 3600,
        productive_hours_ready: ready / 3600,
        total_hours_mohh: mohh / 3600,
        downtime_hours: breakdown / 3600,
        pa,
        ua,
        efficiency,
        availability_score: pa,
      };
    })
    .sort((a, b) => {
      if (a.total_hours_mohh === 0 && b.total_hours_mohh !== 0) return 1;
      if (a.total_hours_mohh !== 0 && b.total_hours_mohh === 0) return -1;
      if (a.total_hours_mohh === 0 && b.total_hours_mohh === 0) return 0;

      const paDiff = b.pa - a.pa;
      if (paDiff !== 0) return paDiff;
      const uaDiff = b.ua - a.ua;
      if (uaDiff !== 0) return uaDiff;
      return b.productive_hours_ready - a.productive_hours_ready;
    })
    .map((row, idx) => ({ ...row, rank: idx + 1 }));

  const byDateMap = new Map<string, NormalizedRow[]>();
  for (const r of norm) {
    if (!r.date) continue;
    if (!byDateMap.has(r.date)) byDateMap.set(r.date, []);
    byDateMap.get(r.date)!.push(r);
  }

  const trend: TrendPoint[] = Array.from(byDateMap.entries())
    .map(([date, sub]) => {
      const ready = sub
        .filter((r) => r.status === "READY")
        .reduce((a, b) => a + b.duration_sec, 0);
      const delayIdle = sub
        .filter((r) => r.status === "DELAY" || r.status === "IDLE")
        .reduce((a, b) => a + b.duration_sec, 0);
      const breakdown = sub
        .filter((r) => r.status === "BREAKDOWN")
        .reduce((a, b) => a + b.duration_sec, 0);

      const mohh = ready + delayIdle + breakdown;
      const pa = mohh > 0 ? ((mohh - breakdown) / mohh) * 100 : null;
      const ua =
        mohh - breakdown > 0
          ? ((mohh - breakdown - delayIdle) / (mohh - breakdown)) * 100
          : null;

      return {
        date,
        mohh_hours: mohh / 3600,
        breakdown_hours: breakdown / 3600,
        delay_idle_hours: delayIdle / 3600,
        ready_hours: ready / 3600,
        pa,
        ua,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const activeVehicles = vehicles.filter((v) => v.total_hours_mohh > 0);

  const summary: Summary = {
    totalVehicles: vehicles.length,
    avgPA:
      activeVehicles.length > 0
        ? activeVehicles.reduce((sum, v) => sum + v.pa, 0) /
          activeVehicles.length
        : 0,
    avgUA:
      activeVehicles.length > 0
        ? activeVehicles.reduce((sum, v) => sum + v.ua, 0) /
          activeVehicles.length
        : 0,
    totalMOHH: vehicles.reduce((sum, v) => sum + v.total_hours_mohh, 0),
    totalBreakdown: vehicles.reduce((sum, v) => sum + v.breakdown_hours, 0),
    totalReady: vehicles.reduce((sum, v) => sum + v.productive_hours_ready, 0),
    optionDistribution: [],
  };

  const optionMap = new Map<string, { seconds: number; category: string }>();
  for (const r of norm) {
    if (r.option && r.option !== "") {
      const key = r.option;
      const existing = optionMap.get(key) || { seconds: 0, category: r.status };
      optionMap.set(key, {
        seconds: existing.seconds + r.duration_sec,
        category: r.status,
      });
    }
  }

  const optionColors: Record<string, string> = {
    READY: "#10b981",
    IDLE: "#8b5cf6",
    DELAY: "#f59e0b",
    BREAKDOWN: "#ef4444",
  };

  summary.optionDistribution = Array.from(optionMap.entries())
    .map(([name, data]) => ({
      name,
      value: data.seconds / 3600,
      color: optionColors[data.category] || "#64748b",
      category: data.category,
    }))
    .sort((a, b) => b.value - a.value);

  return { vehicles, normalizedRows: norm, trend, summary }; // RETURN normalizedRows
}