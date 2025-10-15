// ============ SummaryCards.tsx ============
import { Award, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { Summary } from "@/types/types";

type SummaryCardsProps = {
  summary: Summary;
};

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
        <div className="flex items-center justify-between mb-3">
          <Award className="w-8 h-8 opacity-90" />
          <span className="text-xs font-bold uppercase tracking-wider opacity-80">
            Fleet
          </span>
        </div>
        <p className="text-4xl font-black mb-1">{summary.totalVehicles}</p>
        <p className="text-sm opacity-90">Total Vehicles</p>
      </div>

      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
        <div className="flex items-center justify-between mb-3">
          <TrendingUp className="w-8 h-8 opacity-90" />
          <span className="text-xs font-bold uppercase tracking-wider opacity-80">
            Avg PA
          </span>
        </div>
        <p className="text-4xl font-black mb-1">{summary.avgPA.toFixed(1)}%</p>
        <p className="text-sm opacity-90">Physical Availability</p>
      </div>

      <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
        <div className="flex items-center justify-between mb-3">
          <Clock className="w-8 h-8 opacity-90" />
          <span className="text-xs font-bold uppercase tracking-wider opacity-80">
            Avg UA
          </span>
        </div>
        <p className="text-4xl font-black mb-1">{summary.avgUA.toFixed(1)}%</p>
        <p className="text-sm opacity-90">Utilization Availability</p>
      </div>

      <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
        <div className="flex items-center justify-between mb-3">
          <AlertTriangle className="w-8 h-8 opacity-90" />
          <span className="text-xs font-bold uppercase tracking-wider opacity-80">
            Downtime
          </span>
        </div>
        <p className="text-4xl font-black mb-1">
          {summary.totalBreakdown.toFixed(0)}
        </p>
        <p className="text-sm opacity-90">Breakdown Hours</p>
      </div>
    </section>
  );
}
