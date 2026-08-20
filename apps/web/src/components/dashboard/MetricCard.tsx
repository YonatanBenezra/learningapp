'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { cn } from '@/src/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  subtitle: string;
  color: string;
  data: number[];
  icon: React.ElementType;
  delay?: number;
}

export function MetricCard({
  title,
  value,
  change,
  subtitle,
  color,
  data,
  icon: Icon,
  delay = 0,
}: MetricCardProps) {
  const positive = change >= 0;
  const chartData = data.map((v) => ({ v }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="group flex flex-col rounded-2xl border border-line bg-bg-elev p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <Icon className="size-5" style={{ color }} />
        </div>
        <div className={cn(
          'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
          positive ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad',
        )}>
          {positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {positive ? '+' : ''}{change}%
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-ink-2">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-ink">{value}</p>
        <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>
      </div>

      <div className="mt-auto h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`metric-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={2}
              fill={`url(#metric-${title})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
