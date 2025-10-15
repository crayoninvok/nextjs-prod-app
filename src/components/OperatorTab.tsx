"use client";

import { useMemo, useState } from "react";
import { NormalizedRow } from "@/types/types";
import {
  OperatorData,
  computeOperatorDataFromRows,
  summarizeOperators,
  makeComparator,
  SortKey,
  SortOrder,
} from "@/utils/utils_operator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface OperatorTabProps {
  normalizedRows: NormalizedRow[];
}

export function OperatorTab({ normalizedRows }: OperatorTabProps) {
  const [filterText, setFilterText] = useState("");

  const operatorData = useMemo<OperatorData[]>(
    () => computeOperatorDataFromRows(normalizedRows),
    [normalizedRows]
  );

  const { totalOperators, avgVehiclesPerOperator, bestPA, bestUA } = useMemo(
    () => summarizeOperators(operatorData),
    [operatorData]
  );

  // Ranked operators with filtering
  const rankedOperators = useMemo(() => {
    const ft = filterText.trim().toLowerCase();
    
    // Separate active and zero-hour operators
    const activeOps = operatorData.filter(op => op.totalHours > 0);
    const zeroHourOps = operatorData.filter(op => op.totalHours === 0);

    // Rank active operators by PA (primary), then UA (secondary), then total hours (tertiary)
    const rankedActive = activeOps
      .sort((a, b) => {
        // First by PA descending
        if (b.avgPA !== a.avgPA) return b.avgPA - a.avgPA;
        // Then by UA descending
        if (b.avgUA !== a.avgUA) return b.avgUA - a.avgUA;
        // Finally by total hours descending
        return b.totalHours - a.totalHours;
      })
      .map((op, idx) => ({ ...op, rank: idx + 1 }));

    // Zero-hour operators get no rank (or rank after all active)
    const rankedZero = zeroHourOps
      .sort((a, b) => a.operator.localeCompare(b.operator))
      .map(op => ({ ...op, rank: undefined as number | undefined }));

    // Combine
    const allRanked = [...rankedActive, ...rankedZero];

    // Apply filter
    if (ft) {
      return allRanked.filter(op => op.operator.toLowerCase().includes(ft));
    }
    
    return allRanked;
  }, [operatorData, filterText]);

  // Top 10 operators by PA
  const top10ByPA = useMemo(() => {
    return [...operatorData]
      .filter(op => op.operator !== "UNASSIGNED")
      .sort((a, b) => b.avgPA - a.avgPA)
      .slice(0, 10)
      .map(op => ({
        name: op.operator.length > 15 ? op.operator.slice(0, 15) + "..." : op.operator,
        PA: Number(op.avgPA.toFixed(1)),
        UA: Number(op.avgUA.toFixed(1)),
      }));
  }, [operatorData]);

  // Hours distribution for top 5 operators
  const top5HoursDistribution = useMemo(() => {
    return [...operatorData]
      .filter(op => op.operator !== "UNASSIGNED")
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 5)
      .map(op => ({
        name: op.operator.length > 12 ? op.operator.slice(0, 12) + "..." : op.operator,
        Ready: Number(op.readyHours.toFixed(1)),
        Breakdown: Number(op.totalBreakdown.toFixed(1)),
        Delay: Number(op.totalDelay.toFixed(1)),
        Idle: Number(op.totalIdle.toFixed(1)),
      }));
  }, [operatorData]);

  // Performance distribution pie chart
  const performanceDistribution = useMemo(() => {
    const excellent = operatorData.filter(op => op.avgPA >= 90 && op.operator !== "UNASSIGNED").length;
    const good = operatorData.filter(op => op.avgPA >= 75 && op.avgPA < 90 && op.operator !== "UNASSIGNED").length;
    const needsImprovement = operatorData.filter(op => op.avgPA < 75 && op.operator !== "UNASSIGNED").length;
    
    return [
      { name: "Excellent (≥90%)", value: excellent, color: "#10b981" },
      { name: "Good (75-89%)", value: good, color: "#f59e0b" },
      { name: "Needs Improvement (<75%)", value: needsImprovement, color: "#ef4444" },
    ].filter(item => item.value > 0);
  }, [operatorData]);

  // Radar chart data for top 5 performers
  const radarData = useMemo(() => {
    const top5 = [...operatorData]
      .filter(op => op.operator !== "UNASSIGNED")
      .sort((a, b) => b.avgPA - a.avgPA)
      .slice(0, 5);

    return top5.map(op => ({
      operator: op.operator.length > 10 ? op.operator.slice(0, 10) + "..." : op.operator,
      PA: Number(op.avgPA.toFixed(1)),
      UA: Number(op.avgUA.toFixed(1)),
      Efficiency: Number(((op.avgPA * op.avgUA) / 100).toFixed(1)),
      Utilization: Number(((op.readyHours / op.totalHours) * 100).toFixed(1)),
    }));
  }, [operatorData]);

  // Option distribution by operator
  const optionDistributionData = useMemo(() => {
    const statuses = ['READY', 'BREAKDOWN', 'DELAY', 'IDLE'];
    const gradients: Record<string, string> = {
      READY: "from-green-500 to-emerald-500",
      BREAKDOWN: "from-red-500 to-rose-500",
      DELAY: "from-yellow-500 to-orange-500",
      IDLE: "from-purple-500 to-violet-500",
    };

    return statuses.map(status => {
      // Group options by status from normalized rows
      const optionMap = new Map<string, number>();
      
      normalizedRows
        .filter(r => r.status === status && r.option && r.option.trim() !== "")
        .forEach(r => {
          const option = r.option!.trim();
          optionMap.set(option, (optionMap.get(option) || 0) + r.duration_sec);
        });

      const items = Array.from(optionMap.entries())
        .map(([name, seconds]) => ({
          name,
          value: seconds / 3600, // Convert to hours
          category: status,
        }))
        .sort((a, b) => b.value - a.value);

      return {
        status,
        gradient: gradients[status],
        items,
        total: items.reduce((sum, item) => sum + item.value, 0),
      };
    }).filter(data => data.items.length > 0);
  }, [normalizedRows]);

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
          <div className="text-sm font-medium text-slate-600 mb-1">Total Operators</div>
          <div className="text-3xl font-bold text-slate-800">{totalOperators}</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
          <div className="text-sm font-medium text-slate-600 mb-1">Avg Vehicles per Operator</div>
          <div className="text-3xl font-bold text-blue-600">
            {avgVehiclesPerOperator.toFixed(1)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
          <div className="text-sm font-medium text-slate-600 mb-1">Best PA Performance</div>
          <div className="text-3xl font-bold text-green-600">
            {bestPA.toFixed(1)}%
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
          <div className="text-sm font-medium text-slate-600 mb-1">Best UA Performance</div>
          <div className="text-3xl font-bold text-purple-600">
            {bestUA.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Top 10 Operators PA/UA Performance */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
            Top 10 Operators - PA & UA Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top10ByPA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                formatter={(value: number) => `${value}%`}
              />
              <Legend />
              <Bar dataKey="PA" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="UA" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Distribution Pie Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
            PA Performance Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={performanceDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {performanceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Hours Distribution Stacked Bar */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
            Top 5 Operators - Hours Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top5HoursDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                formatter={(value: number) => `${value}h`}
              />
              <Legend />
              <Bar dataKey="Ready" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Delay" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Idle" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Breakdown" stackId="a" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart - Multi-metric Performance */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
            Top 5 Operators - Multi-Metric Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="operator" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="PA" dataKey="PA" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Radar name="UA" dataKey="UA" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 mb-8">
        <input
          type="text"
          placeholder="Search operators..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          aria-label="Search operators"
        />
      </div>

      {/* Option Distribution Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {optionDistributionData.map(({ status, gradient, items, total }) => {
          const topData = items.slice(0, 10);
          const hasMore = items.length > 10;

          return (
            <div key={status} className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <div className={`w-1 h-6 bg-gradient-to-b ${gradient} rounded-full`}></div>
                  {status} Activities Distribution
                </h2>
                <div className="text-sm text-slate-600">
                  Total: <span className="font-bold text-slate-900">{total.toFixed(1)}h</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {topData.map((item, index) => {
                  const percentage = (item.value / total) * 100;
                  return (
                    <div key={index} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-700 truncate flex-1 mr-4">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-semibold text-slate-900 min-w-[60px] text-right">
                            {item.value.toFixed(1)}h
                          </span>
                          <span className="font-bold text-slate-600 min-w-[50px] text-right">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                        <div 
                          className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500 shadow-sm`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {hasMore && (
                  <div className="pt-2 text-center">
                    <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                      +{items.length - 10} more activities
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
          Operator Performance Analysis
        </h2>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-300">
                <th className="py-4 px-4 text-sm font-bold text-slate-700 text-center">Rank</th>
                <th className="py-4 px-4 text-sm font-bold text-slate-700 text-left">Operator</th>
                <th className="py-4 px-4 text-sm font-bold text-slate-700 text-center">Vehicles</th>
                <th className="py-4 px-4 text-sm font-bold text-slate-700 text-right">Total Hours</th>
                <th className="py-4 px-4 text-sm font-bold text-slate-700 text-right">Avg PA %</th>
                <th className="py-4 px-4 text-sm font-bold text-slate-700 text-right">Avg UA %</th>
                <th className="py-4 px-4 text-sm font-bold text-slate-700 text-right">Ready</th>
                <th className="py-4 px-4 text-sm font-bold text-slate-700 text-right">Breakdown</th>
                <th className="py-4 px-4 text-sm font-bold text-slate-700 text-right">Delay</th>
                <th className="py-4 px-4 text-sm font-bold text-slate-700 text-right">Idle</th>
              </tr>
            </thead>

            <tbody>
              {rankedOperators.map((op, idx) => (
                <tr key={`${op.operator}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 text-center">
                    {op.rank ? (
                      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                        op.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-lg' :
                        op.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md' :
                        op.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {op.rank <= 3 ? (op.rank === 1 ? '🥇' : op.rank === 2 ? '🥈' : '🥉') : op.rank}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm font-semibold text-slate-800">{op.operator}</td>
                  <td className="py-4 px-4 text-sm text-slate-600 text-center font-medium">{op.vehicleCount}</td>
                  <td className="py-4 px-4 text-sm text-slate-700 text-right font-medium">{op.totalHours.toFixed(1)}</td>
                  <td className="py-4 px-4 text-sm text-right">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                      op.avgPA >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                      op.avgPA >= 75 ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' :
                      'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                    }`}>
                      {op.avgPA.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-right">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                      op.avgUA >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                      op.avgUA >= 75 ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' :
                      'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                    }`}>
                      {op.avgUA.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-green-600 text-right font-medium">{op.readyHours.toFixed(1)}</td>
                  <td className="py-4 px-4 text-sm text-red-600 text-right font-medium">{op.totalBreakdown.toFixed(1)}</td>
                  <td className="py-4 px-4 text-sm text-yellow-600 text-right font-medium">{op.totalDelay.toFixed(1)}</td>
                  <td className="py-4 px-4 text-sm text-purple-600 text-right font-medium">{op.totalIdle.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {rankedOperators.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <div className="text-lg font-medium">No operators found</div>
              <div className="text-sm mt-1">Try adjusting your search criteria</div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6 text-xs text-slate-500">
          <p>
            Showing <span className="font-semibold text-slate-700">{rankedOperators.length}</span> of{" "}
            <span className="font-semibold text-slate-700">{operatorData.length}</span> operators
          </p>
          <p>Ranked by PA → UA → Total Hours</p>
        </div>
      </div>
    </div>
  );
}

// Remove the Th component as we no longer need sortable headers