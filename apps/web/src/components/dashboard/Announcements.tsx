'use client';

import { motion } from 'framer-motion';
import { Megaphone, AlertTriangle, Info, PartyPopper } from 'lucide-react';


const announcements = [
  {
    id: '1',
    icon: PartyPopper,
    color: '#22C55E',
    bg: '#F0FDF4',
    title: 'New Feature: Live Classes',
    description: 'Schedule and host live video sessions with your students directly from the platform.',
    date: 'Jul 18, 2026',
  },
  {
    id: '2',
    icon: AlertTriangle,
    color: '#F59E0B',
    bg: '#FFFBEB',
    title: 'Scheduled Maintenance',
    description: 'Platform maintenance on Jul 22 from 2:00 AM to 4:00 AM UTC.',
    date: 'Jul 16, 2026',
  },
  {
    id: '3',
    icon: Info,
    color: '#4F46E5',
    bg: '#EEF2FF',
    title: 'Updated Pricing Plans',
    description: 'New enterprise tier with advanced analytics and priority support.',
    date: 'Jul 14, 2026',
  },
];

export function Announcements() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.0 }}
      className="flex flex-col rounded-2xl border border-line bg-bg-elev p-6 shadow-soft"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="size-4 text-primary" />
          <h3 className="text-lg font-bold text-ink">Announcements</h3>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {announcements.map((a) => (
          <div
            key={a.id}
            className="rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-line hover:bg-bg-soft/50"
          >
            <div className="flex gap-3">
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: a.bg }}
              >
                <a.icon className="size-4.5" style={{ color: a.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{a.title}</p>
                  <span className="text-[11px] text-ink-3">{a.date}</span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{a.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
