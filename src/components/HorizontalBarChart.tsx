// ============ HorizontalBarChart.tsx ============
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type HorizontalBarChartProps = {
  title: string;
  data: { name: string; hours: number }[];
  color: string;
  gradient: string;
};

export function HorizontalBarChart({ title, data, color, gradient }: HorizontalBarChartProps) {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 hover:shadow-2xl transition-shadow">
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <div className={`w-1 h-6 bg-gradient-to-b ${gradient} rounded-full`}></div>
        {title}
      </h2>
      <div className="w-full h-80">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" stroke="#64748b" style={{ fontSize: 11 }} />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={90}
              tick={{ fontSize: 9 }} 
              stroke="#64748b"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }} 
            />
            <Bar dataKey="hours" name={title} fill={color} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}