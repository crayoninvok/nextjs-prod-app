// ============ VehicleTable.tsx ============
import { CombinedVehicleRow } from '@/types/types';

type VehicleTableProps = {
  vehicles: CombinedVehicleRow[];
  filterText: string;
  onFilterChange: (value: string) => void;
};

export function VehicleTable({ vehicles, filterText, onFilterChange }: VehicleTableProps) {
  const filteredVehicles = vehicles.filter(v => 
    v.vehicle_name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <section className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 hover:shadow-2xl transition-shadow">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
          Vehicle Performance Table
        </h2>
        <input
          type="text"
          placeholder="Filter by vehicle name..."
          value={filterText}
          onChange={(e) => onFilterChange(e.target.value)}
          className="px-5 py-3 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm hover:shadow-md transition-shadow w-full sm:w-64"
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="text-left bg-gradient-to-r from-slate-50 to-slate-100">
            <tr>
              <th className="py-4 px-4 font-bold text-slate-700 border-b-2 border-slate-300">Rank</th>
              <th className="py-4 px-4 font-bold text-slate-700 border-b-2 border-slate-300">Vehicle</th>
              <th className="py-4 px-4 font-bold text-slate-700 border-b-2 border-slate-300">Breakdown (h)</th>
              <th className="py-4 px-4 font-bold text-slate-700 border-b-2 border-slate-300">Delay (h)</th>
              <th className="py-4 px-4 font-bold text-slate-700 border-b-2 border-slate-300">Idle (h)</th>
              <th className="py-4 px-4 font-bold text-slate-700 border-b-2 border-slate-300">Ready (h)</th>
              <th className="py-4 px-4 font-bold text-slate-700 border-b-2 border-slate-300">MOHH (h)</th>
              <th className="py-4 px-4 font-bold text-slate-700 border-b-2 border-slate-300">PA (%)</th>
              <th className="py-4 px-4 font-bold text-slate-700 border-b-2 border-slate-300">UA (%)</th>
              <th className="py-4 px-4 font-bold text-slate-700 border-b-2 border-slate-300">Efficiency (%)</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map((v) => {
              const isZeroMOHH = v.total_hours_mohh === 0;
              const isTopThree = !isZeroMOHH && v.rank && v.rank <= 3;
              
              return (
                <tr 
                  key={v.vehicle_name} 
                  className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                    isTopThree ? 'bg-gradient-to-r from-yellow-50 to-amber-50' : ''
                  } ${isZeroMOHH ? 'bg-slate-50 opacity-60' : ''}`}
                >
                  <td className="py-4 px-4 text-slate-900">
                    {isZeroMOHH ? (
                      <span className="text-slate-400">—</span>
                    ) : isTopThree ? (
                      <span className="font-black text-lg bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                        #{v.rank}
                      </span>
                    ) : (
                      v.rank
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`font-semibold ${isZeroMOHH ? 'text-slate-500' : 'text-slate-900'}`}>
                      {v.vehicle_name}
                    </span>
                    {isZeroMOHH && (
                      <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                        No Activity
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-slate-600">{v.breakdown_hours.toFixed(1)}</td>
                  <td className="py-4 px-4 text-slate-600">{v.delay_hours.toFixed(1)}</td>
                  <td className="py-4 px-4 text-slate-600">{v.idle_hours.toFixed(1)}</td>
                  <td className="py-4 px-4 text-slate-600">{v.productive_hours_ready.toFixed(1)}</td>
                  <td className="py-4 px-4">
                    <span className={`font-semibold ${isZeroMOHH ? 'text-slate-400' : 'text-slate-900'}`}>
                      {v.total_hours_mohh.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {isZeroMOHH ? (
                      <span className="text-xs text-slate-400">N/A</span>
                    ) : (
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                        v.pa >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                        v.pa >= 75 ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' :
                        'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                      }`}>
                        {v.pa.toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {isZeroMOHH ? (
                      <span className="text-xs text-slate-400">N/A</span>
                    ) : (
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                        v.ua >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                        v.ua >= 75 ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' :
                        'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                      }`}>
                        {v.ua.toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`font-medium ${isZeroMOHH ? 'text-slate-400' : 'text-slate-700'}`}>
                      {isZeroMOHH ? 'N/A' : `${v.efficiency.toFixed(1)}%`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-6 text-xs text-slate-500">
        <p>
          Showing <span className="font-semibold text-slate-700">{filteredVehicles.length}</span> of <span className="font-semibold text-slate-700">{vehicles.length}</span> vehicles
        </p>
        <p>
          Top 3 performers highlighted • Vehicles with 0.0 MOHH shown at bottom
        </p>
      </div>
    </section>
  );
}
