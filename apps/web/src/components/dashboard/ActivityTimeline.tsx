'use client';

import { motion } from 'framer-motion';
import {
  UserPlus,
  BookOpen,
  Trophy,
  CreditCard,
  Star,
  MessageSquare,
} from 'lucide-react';


const activities = [
  {
    id: '1',
    icon: UserPlus,
    color: '#4F46E5',
    bg: '#EEF2FF',
    title: 'New student enrolled',
    description: 'Sarah Johnson enrolled in Advanced React Patterns',
    time: '2 min ago',
  },
  {
    id: '2',
    icon: Trophy,
    color: '#F59E0B',
    bg: '#FFFBEB',
    title: 'Course completed',
    description: 'Michael Chen completed Node.js Masterclass',
    time: '15 min ago',
  },
  {
    id: '3',
    icon: CreditCard,
    color: '#22C55E',
    bg: '#F0FDF4',
    title: 'Payment received',
    description: '$199 from Emma Wilson for Python for Data Science',
    time: '1 hour ago',
  },
  {
    id: '4',
    icon: Star,
    color: '#7C3AED',
    bg: '#F3E8FF',
    title: 'New review posted',
    description: 'James Rodriguez left a 5-star review on UI/UX Design',
    time: '2 hours ago',
  },
  {
    id: '5',
    icon: BookOpen,
    color: '#06B6D4',
    bg: '#ECFEFF',
    title: 'Course published',
    description: 'DevOps Engineering course is now live',
    time: '3 hours ago',
  },
  {
    id: '6',
    icon: MessageSquare,
    color: '#EF4444',
    bg: '#FEF2F2',
    title: 'Support ticket',
    description: 'Olivia Brown submitted a support request',
    time: '5 hours ago',
  },
];

export function ActivityTimeline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="flex flex-col rounded-2xl border border-line bg-bg-elev p-6 shadow-soft"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-ink">Recent Activity</h3>
        <button className="text-xs font-semibold text-primary hover:underline">View all</button>
      </div>

      <div className="mt-5 flex flex-col gap-1">
        {activities.map((activity, i) => (
          <div key={activity.id} className="group flex gap-3.5">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: activity.bg }}
              >
                <activity.icon className="size-4" style={{ color: activity.color }} />
              </div>
              {i < activities.length - 1 && (
                <div className="my-1 w-px flex-1 bg-line" />
              )}
            </div>
            {/* Content */}
            <div className="min-w-0 flex-1 pb-4">
              <p className="text-sm font-medium text-ink">{activity.title}</p>
              <p className="mt-0.5 text-xs text-ink-2 truncate">{activity.description}</p>
              <p className="mt-1 text-[11px] text-ink-3">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
