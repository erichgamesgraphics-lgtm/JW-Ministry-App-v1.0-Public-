import React from 'react';

interface SimpleBarChartProps {
  data: Array<{ label: string; value: number }>;
  barColor?: string;
  unit?: string;
  className?: string;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  barColor = 'bg-blue-600 dark:bg-blue-500',
  unit = 'h',
  className = '',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        No breakdown data available
      </div>
    );
  }

  const maxValue = Math.max(1, ...data.map(d => d.value));

  return (
    <div className={`w-full ${className}`}>
      {/* Chart Bars Area */}
      <div className="flex h-36 items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {data.map((item, idx) => {
          const heightPercent = Math.max(4, Math.round((item.value / maxValue) * 100));
          return (
            <div key={idx} className="flex flex-1 flex-col items-center justify-end h-full group">
              {/* Value Tooltip / Label */}
              <span className="mb-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 transition-opacity">
                {item.value > 0 ? `${item.value}${unit}` : '-'}
              </span>

              {/* Bar */}
              <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800/80 rounded-t-md overflow-hidden flex items-end h-full">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full ${barColor} rounded-t-md transition-all duration-500 hover:brightness-110`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* X-Axis Labels */}
      <div className="mt-2 flex justify-between gap-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 text-center">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
