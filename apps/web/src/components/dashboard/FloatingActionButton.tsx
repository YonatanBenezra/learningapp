'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  BookOpen,
  UserPlus,
  Bell,
  Upload,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const actions = [
  { icon: BookOpen, label: 'Create Course', color: '#4F46E5', href: '/create-course' },
  { icon: UserPlus, label: 'Add Student', color: '#7C3AED', href: '/students' },
  { icon: Bell, label: 'Send Notification', color: '#06B6D4', href: '/notifications' },
  { icon: Upload, label: 'Upload Video', color: '#22C55E', href: '/my-courses' },
];

export function FloatingActionButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col-reverse items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            className="flex flex-col gap-2"
          >
            {actions.map((action, i) => (
              <motion.a
                key={action.label}
                href={action.href}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-xl border border-line bg-bg-elev px-4 py-2.5 shadow-elevated transition-all duration-200 hover:shadow-lift"
              >
                <div
                  className="flex size-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <action.icon className="size-4" style={{ color: action.color }} />
                </div>
                <span className="text-sm font-medium text-ink">{action.label}</span>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.92 }}
        className={cn(
          'flex size-14 items-center justify-center rounded-2xl bg-linear-to-r from-primary to-secondary text-white shadow-lg transition-all duration-300',
          open ? 'shadow-xl rotate-45' : 'shadow-lg hover:shadow-xl hover:brightness-110',
        )}
      >
        <Plus className="size-6" />
      </motion.button>
    </div>
  );
}
