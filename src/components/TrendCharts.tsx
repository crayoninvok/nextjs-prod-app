// ============ TrendChart.tsx ============
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendPoint } from '@/types/types';

type TrendChartProps = {
  data: TrendPoint[];
};

export function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 hover:shadow-2xl transition-shadow">
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
        PA/UA Trend Over Time
      </h2>
      <div className="w-full h-80">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} stroke="#64748b" style={{ fontSize: 11 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }} 
            />
            <Legend />
            <Line type="monotone" dataKey="pa" name="PA (%)" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
            <Line type="monotone" dataKey="ua" name="UA (%)" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}