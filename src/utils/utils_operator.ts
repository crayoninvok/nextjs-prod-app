// ============ utils_operator.ts ============
import { CombinedVehicleRow, NormalizedRow } from '@/types/types';

export type OperatorData = {
  operator: string;
  vehicleCount: number;
  totalHours: number;
  avgPA: number;
  avgUA: number;
  readyHours: number;
  totalBreakdown: number;
  totalDelay: number;
  totalIdle: number;
};

export type SortKey = keyof OperatorData;
export type SortOrder = "asc" | "desc";

/**
 * Groups vehicles by operator and computes aggregated metrics from normalized rows
 */
export function computeOperatorDataFromRows(normalizedRows: NormalizedRow[]): OperatorData[] {
  const operatorMap = new Map<string, NormalizedRow[]>();

  // Group rows by operator
  for (const r of normalizedRows) {
    const op = r.operator_name?.trim() || "UNASSIGNED";
    if (!operatorMap.has(op)) {
      operatorMap.set(op, []);
    }
    operatorMap.get(op)!.push(r);
  }

  // Compute aggregates for each operator
  const result: OperatorData[] = [];
  
  operatorMap.forEach((rows, operator) => {
    // Get unique vehicles for this operator
    const uniqueVehicles = new Set(rows.map(r => r.vehicle_name));
    const vehicleCount = uniqueVehicles.size;

    // Calculate hours
    const readyHours = rows.filter(r => r.status === "READY").reduce((sum: number, r: NormalizedRow) => sum + r.duration_sec, 0) / 3600;
    const totalBreakdown = rows.filter(r => r.status === "BREAKDOWN").reduce((sum: number, r: NormalizedRow) => sum + r.duration_sec, 0) / 3600;
    const totalDelay = rows.filter(r => r.status === "DELAY").reduce((sum: number, r: NormalizedRow) => sum + r.duration_sec, 0) / 3600;
    const totalIdle = rows.filter(r => r.status === "IDLE").reduce((sum: number, r: NormalizedRow) => sum + r.duration_sec, 0) / 3600;
    
    const totalHours = readyHours + totalBreakdown + totalDelay + totalIdle;

    // Calculate PA and UA
    const delayIdle = totalDelay + totalIdle;
    const mohh = totalHours;
    const avgPA = mohh > 0 ? ((mohh - totalBreakdown) / mohh) * 100 : 0;
    const avgUA = (mohh - totalBreakdown) > 0 ? ((mohh - totalBreakdown - delayIdle) / (mohh - totalBreakdown)) * 100 : 0;

    result.push({
      operator,
      vehicleCount,
      totalHours,
      avgPA,
      avgUA,
      readyHours,
      totalBreakdown,
      totalDelay,
      totalIdle,
    });
  });

  return result;
}

/**
 * Legacy function - groups vehicles by operator from CombinedVehicleRow
 */
export function computeOperatorData(vehicles: CombinedVehicleRow[]): OperatorData[] {
  const operatorMap = new Map<string, CombinedVehicleRow[]>();

  // Group vehicles by operator
  for (const v of vehicles) {
    const op = v.operator?.trim() || "UNASSIGNED";
    if (!operatorMap.has(op)) {
      operatorMap.set(op, []);
    }
    operatorMap.get(op)!.push(v);
  }

  // Compute aggregates for each operator
  const result: OperatorData[] = [];
  
  operatorMap.forEach((vehicleList, operator) => {
    // Only include vehicles with activity (MOHH > 0)
    const activeVehicles = vehicleList.filter((v: CombinedVehicleRow) => v.total_hours_mohh > 0);
    
    const vehicleCount = vehicleList.length;
    const totalHours = vehicleList.reduce((sum: number, v: CombinedVehicleRow) => sum + v.total_hours_mohh, 0);
    const readyHours = vehicleList.reduce((sum: number, v: CombinedVehicleRow) => sum + v.productive_hours_ready, 0);
    const totalBreakdown = vehicleList.reduce((sum: number, v: CombinedVehicleRow) => sum + v.breakdown_hours, 0);
    const totalDelay = vehicleList.reduce((sum: number, v: CombinedVehicleRow) => sum + v.delay_hours, 0);
    const totalIdle = vehicleList.reduce((sum: number, v: CombinedVehicleRow) => sum + v.idle_hours, 0);

    // Average PA/UA only from active vehicles
    const avgPA = activeVehicles.length > 0
      ? activeVehicles.reduce((sum: number, v: CombinedVehicleRow) => sum + v.pa, 0) / activeVehicles.length
      : 0;
    
    const avgUA = activeVehicles.length > 0
      ? activeVehicles.reduce((sum: number, v: CombinedVehicleRow) => sum + v.ua, 0) / activeVehicles.length
      : 0;

    result.push({
      operator,
      vehicleCount,
      totalHours,
      avgPA,
      avgUA,
      readyHours,
      totalBreakdown,
      totalDelay,
      totalIdle,
    });
  });

  return result;
}

/**
 * Summarizes operator data for dashboard cards
 */
export function summarizeOperators(data: OperatorData[]) {
  const totalOperators = data.length;
  
  const avgVehiclesPerOperator = totalOperators > 0
    ? data.reduce((sum, op) => sum + op.vehicleCount, 0) / totalOperators
    : 0;

  const bestPA = data.length > 0
    ? Math.max(...data.map(op => op.avgPA))
    : 0;

  const bestUA = data.length > 0
    ? Math.max(...data.map(op => op.avgUA))
    : 0;

  return {
    totalOperators,
    avgVehiclesPerOperator,
    bestPA,
    bestUA,
  };
}

/**
 * Creates a comparator function for sorting operator data
 */
export function makeComparator(sortBy: SortKey, sortOrder: SortOrder) {
  return (a: OperatorData, b: OperatorData): number => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    let comparison = 0;

    if (typeof aVal === "string" && typeof bVal === "string") {
      comparison = aVal.localeCompare(bVal);
    } else if (typeof aVal === "number" && typeof bVal === "number") {
      comparison = aVal - bVal;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  };
}

/**
 * Returns Tailwind classes for performance coloring
 */
export function getPerformanceClass(value: number, metric: "pa" | "ua"): string {
  if (value >= 90) return "text-green-600";
  if (value >= 75) return "text-yellow-600";
  return "text-red-600";
}