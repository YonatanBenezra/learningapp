'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Active', value: 4850, color: '#4F46E5' },
  { name: 'Completed', value: 3200, color: '#22C55E' },
  { name: 'Pending', value: 890, color: '#F59E0B' },
  { name: 'Cancelled', value: 260, color: '#EF4444' },
];

const total = data.reduce((acc, d) => acc + d.value, 0);
const activePercent = Math.round((data[0].value / total) * 100);

export function EnrollmentChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="flex flex-col rounded-2xl border border-line bg-bg-elev p-6 shadow-soft"
    >
      <div>
        <h3 className="text-lg font-bold text-ink">Enrollment Overview</h3>
        <p className="text-sm text-ink-2">Total: {total.toLocaleString()} enrollments</p>
      </div>

      <div className="relative flex flex-1 items-center justify-center py-6">
        <div className="h-[200px] w-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-ink">{activePercent}%</span>
          <span className="text-xs text-ink-3">Active</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2.5">
            <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-2">{item.name}</p>
              <p className="text-sm font-semibold text-ink">{item.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
