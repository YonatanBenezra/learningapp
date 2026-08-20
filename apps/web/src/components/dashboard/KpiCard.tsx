'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  change: number;
  changeLabel?: string;
  icon: React.ElementType;
  gradient: string;
  sparklineData: number[];
  delay?: number;
}

function AnimatedNumber({ value }: { value: string | number }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  const target = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;

  useEffect(() => {
    if (isNaN(target)) return;
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(target * eased * 100) / 100);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target]);

  const formatted = typeof value === 'string' && value.includes('$')
    ? `$${displayed.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : typeof value === 'string' && value.includes('%')
      ? `${displayed.toFixed(1)}%`
      : displayed.toLocaleString('en-US', { maximumFractionDigits: 0 });

  return <span ref={ref}>{formatted}</span>;
}

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const width = 120;
  const height = 40;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn('w-full h-full', className)} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sparkline-grad-${data.join('-')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#sparkline-grad-${data.join('-')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KpiCard({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  icon: Icon,
  gradient,
  sparklineData,
  delay = 0,
}: KpiCardProps) {
  const positive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'group relative overflow-hidden rounded-2xl p-6 text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl',
        gradient,
      )}
    >
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Decorative circle */}
      <div className="absolute -right-6 -top-6 size-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-125" />
      <div className="absolute -bottom-8 -right-8 size-32 rounded-full bg-white/5" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              <AnimatedNumber value={value} />
            </p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Icon className="size-5" />
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div className="flex items-center gap-1.5">
            {positive ? (
              <TrendingUp className="size-3.5 text-white/80" />
            ) : (
              <TrendingDown className="size-3.5 text-white/80" />
            )}
            <span className={cn('text-sm font-semibold', positive ? 'text-white/90' : 'text-white/90')}>
              {positive ? '+' : ''}{change}%
            </span>
            <span className="text-xs text-white/50">{changeLabel}</span>
          </div>
          <div className="h-10 w-24 text-white/60">
            <Sparkline data={sparklineData} />
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/15">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.abs(change) * 5, 100)}%` }}
            transition={{ duration: 1.2, delay: delay + 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="h-full rounded-full bg-white/50"
          />
        </div>
      </div>
    </motion.div>
  );
}
