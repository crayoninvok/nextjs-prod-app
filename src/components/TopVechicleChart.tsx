import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

type TopVehiclesChartProps = {
  data: { name: string; PA: number; UA: number }[];
};

export function TopVehiclesChart({ data }: TopVehiclesChartProps) {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 hover:shadow-2xl transition-shadow">
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <div className="w-1 h-6 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full"></div>
        Top 15 Vehicles — PA & UA
      </h2>
      <div className="w-full h-80">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 9 }} 
              interval={0} 
              angle={-45} 
              textAnchor="end" 
              height={90}
              stroke="#64748b"
            />
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
            <Bar dataKey="PA" name="PA (%)" fill="#10b981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="UA" name="UA (%)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}