// ============ StatusPieChart.tsx ============
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type StatusPieChartProps = {
  data: { name: string; value: number; color: string }[];
};

export function StatusPieChart({ data }: StatusPieChartProps) {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 hover:shadow-2xl transition-shadow">
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
        Status Time Distribution
      </h2>
      <div className="w-full h-80">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={(entry: any) => `${entry.name}: ${((entry.value / data.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%`}
              outerRadius={110}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => `${value.toFixed(1)} hours`}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                border: '1px solid #e2e8f0',
                borderRadius: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}