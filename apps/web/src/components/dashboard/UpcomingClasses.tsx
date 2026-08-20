'use client';

import { motion } from 'framer-motion';
import { Video, Clock, Users } from 'lucide-react';

const classes = [
  {
    id: '1',
    title: 'Advanced React Hooks Deep Dive',
    instructor: 'John Smith',
    time: 'Today, 3:00 PM',
    students: 45,
    color: '#4F46E5',
  },
  {
    id: '2',
    title: 'Python Data Analysis Workshop',
    instructor: 'David Brown',
    time: 'Today, 5:30 PM',
    students: 32,
    color: '#7C3AED',
  },
  {
    id: '3',
    title: 'UI/UX Design Sprint Review',
    instructor: 'Lisa Anderson',
    time: 'Tomorrow, 10:00 AM',
    students: 28,
    color: '#06B6D4',
  },
  {
    id: '4',
    title: 'Cloud Architecture Q&A Session',
    instructor: 'Emily Davis',
    time: 'Tomorrow, 2:00 PM',
    students: 19,
    color: '#22C55E',
  },
];

export function UpcomingClasses() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="flex flex-col rounded-2xl border border-line bg-bg-elev p-6 shadow-soft"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-ink">Upcoming Classes</h3>
        <button className="text-xs font-semibold text-primary hover:underline">View all</button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="group flex items-center gap-3.5 rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-line hover:bg-bg-soft/50"
          >
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${cls.color}15` }}
            >
              <Video className="size-5" style={{ color: cls.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink group-hover:text-primary">
                {cls.title}
              </p>
              <p className="text-xs text-ink-2">{cls.instructor}</p>
            </div>
            <div className="hidden shrink-0 text-right sm:block">
              <div className="flex items-center gap-1 text-xs text-ink-3">
                <Clock className="size-3" />
                {cls.time}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-3">
                <Users className="size-3" />
                {cls.students} students
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
