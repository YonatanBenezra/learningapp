'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from 'recharts';
import { cn } from '@/src/lib/utils';

const tabs = ['Daily', 'Weekly', 'Monthly', 'Yearly'] as const;
type Tab = (typeof tabs)[number];

const dataByTab: Record<Tab, { labels: string[]; revenue: number[]; enrollments: number[]; completions: number[] }> = {
  Daily: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    revenue: [4200, 5800, 4900, 6200, 7100, 8400, 6800],
    enrollments: [120, 180, 150, 210, 240, 290, 220],
    completions: [80, 120, 95, 150, 170, 210, 160],
  },
  Weekly: {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
    revenue: [28000, 32000, 29500, 35000, 38000, 42000, 40000, 45000],
    enrollments: [840, 960, 885, 1050, 1140, 1260, 1200, 1350],
    completions: [560, 640, 590, 700, 760, 840, 800, 900],
  },
  Monthly: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    revenue: [95000, 102000, 89000, 115000, 128000, 142000, 135000, 155000, 148000, 162000, 175000, 190000],
    enrollments: [2850, 3060, 2670, 3450, 3840, 4260, 4050, 4650, 4440, 4860, 5250, 5700],
    completions: [1900, 2040, 1780, 2300, 2560, 2840, 2700, 3100, 2960, 3240, 3500, 3800],
  },
  Yearly: {
    labels: ['2020', '2021', '2022', '2023', '2024', '2025', '2026'],
    revenue: [520000, 680000, 890000, 1150000, 1420000, 1750000, 2100000],
    enrollments: [15600, 20400, 26700, 34500, 42600, 52500, 63000],
    completions: [10400, 13600, 17800, 23000, 28400, 35000, 42000],
  },
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-xl border border-line bg-bg-elev p-3 shadow-elevated">
      <p className="mb-2 text-xs font-semibold text-ink">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-ink-2 capitalize">{p.name}:</span>
          <span className="font-semibold text-ink">
            {p.name === 'revenue' ? `$${p.value.toLocaleString()}` : p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsChart() {
  const [activeTab, setActiveTab] = useState<Tab>('Monthly');
  const chartData = dataByTab[activeTab];

  const formattedData = chartData.labels.map((label, i) => ({
    name: label,
    revenue: chartData.revenue[i],
    enrollments: chartData.enrollments[i],
    completions: chartData.completions[i],
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="flex flex-col rounded-2xl border border-line bg-bg-elev p-6 shadow-soft"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-ink">Platform Analytics</h3>
          <p className="text-sm text-ink-2">Revenue, enrollments & completions</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-bg-soft p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200',
                activeTab === tab
                  ? 'bg-bg-elev text-primary shadow-soft'
                  : 'text-ink-3 hover:text-ink-2',
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {[
          { label: 'Revenue', color: '#4F46E5' },
          { label: 'Enrollments', color: '#7C3AED' },
          { label: 'Completions', color: '#06B6D4' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2 text-xs text-ink-2">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      <div className="mt-4 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              fill="url(#gradRevenue)"
              stroke="none"
            />
            <Bar
              dataKey="enrollments"
              fill="#7C3AED"
              opacity={0.7}
              radius={[6, 6, 0, 0]}
              barSize={activeTab === 'Monthly' ? 20 : 32}
            />
            <Line
              type="monotone"
              dataKey="completions"
              stroke="#06B6D4"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: '#06B6D4' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
