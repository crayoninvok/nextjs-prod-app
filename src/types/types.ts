// ============ types.ts ============
export type Row = {
  date?: string | number | Date;
  vehicle_name?: string;
  status?: string;
  duration?: string;
  option?: string;
  operator_name?: string;
};

export type NormalizedRow = Row & {
  status: string;
  date?: string;
  duration_sec: number;
  option?: string;
};

export type CombinedVehicleRow = {
  rank?: number;
  vehicle_name: string;
  breakdown_hours: number;
  delay_hours: number;
  idle_hours: number;
  delay_idle_hours: number;
  productive_hours_ready: number;
  total_hours_mohh: number;
  downtime_hours: number;
  pa: number;
  ua: number;
  efficiency: number;
  availability_score: number;
  operator?: string;
};

export type TrendPoint = {
  date: string;
  mohh_hours: number;
  breakdown_hours: number;
  delay_idle_hours: number;
  ready_hours: number;
  pa: number | null;
  ua: number | null;
};

export type Summary = {
  totalVehicles: number;
  avgPA: number;
  avgUA: number;
  totalMOHH: number;
  totalBreakdown: number;
  totalReady: number;
  optionDistribution: {
    name: string;
    value: number;
    color: string;
    category: string;
  }[];
};
