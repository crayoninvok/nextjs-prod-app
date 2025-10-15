// ============ ActivityDistribution.tsx ============
import { Summary } from '@/types/types';

type ActivityDistributionProps = {
  summary: Summary;
};

export function ActivityDistribution({ summary }: ActivityDistributionProps) {
  const statuses = ['READY', 'BREAKDOWN', 'DELAY', 'IDLE'];
  
  const gradients: Record<string, string> = {
    READY: "from-green-500 to-emerald-500",
    BREAKDOWN: "from-red-500 to-rose-500",
    DELAY: "from-yellow-500 to-orange-500",
    IDLE: "from-purple-500 to-violet-500",
  };

  return (
    <>
      {statuses.map(status => {
        const statusData = summary.optionDistribution.filter(item => item.category === status);
        if (statusData.length === 0) return null;
        
        const sortedData = [...statusData].sort((a, b) => b.value - a.value);
        const topData = sortedData.slice(0, 10);
        const hasMore = sortedData.length > 10;
        const total = statusData.reduce((sum, item) => sum + item.value, 0);

        return (
          <div key={status} className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 hover:shadow-2xl transition-shadow lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <div className={`w-1 h-6 bg-gradient-to-b ${gradients[status]} rounded-full`}></div>
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
                        className={`h-full bg-gradient-to-r ${gradients[status]} rounded-full transition-all duration-500 shadow-sm`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {hasMore && (
                <div className="pt-2 text-center">
                  <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                    +{sortedData.length - 10} more activities
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}