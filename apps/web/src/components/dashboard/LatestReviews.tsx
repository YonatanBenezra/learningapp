'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Avatar } from '@/src/components/ui/avatar';

const reviews = [
  {
    id: '1',
    student: 'Sarah Johnson',
    course: 'Advanced React Patterns',
    rating: 5,
    comment: 'Incredible course! The hooks section alone was worth it.',
    time: '2 hours ago',
  },
  {
    id: '2',
    student: 'Michael Chen',
    course: 'Node.js Masterclass',
    rating: 5,
    comment: 'Best backend course I have taken. Very practical.',
    time: '5 hours ago',
  },
  {
    id: '3',
    student: 'Emma Wilson',
    course: 'Python for Data Science',
    rating: 4,
    comment: 'Great content, could use more real-world projects.',
    time: '1 day ago',
  },
  {
    id: '4',
    student: 'James Rodriguez',
    course: 'UI/UX Design Fundamentals',
    rating: 5,
    comment: 'Transformed my understanding of design principles.',
    time: '2 days ago',
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn('size-3.5', s <= count ? 'fill-warn text-warn' : 'text-line-2')}
        />
      ))}
    </div>
  );
}

export function LatestReviews() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}
      className="flex flex-col rounded-2xl border border-line bg-bg-elev p-6 shadow-soft"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-ink">Latest Reviews</h3>
        <button className="text-xs font-semibold text-primary hover:underline">View all</button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-line hover:bg-bg-soft/50"
          >
            <div className="flex items-start gap-3">
              <Avatar name={review.student} className="size-8 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{review.student}</p>
                  <span className="text-[11px] text-ink-3">{review.time}</span>
                </div>
                <p className="text-xs text-ink-2">{review.course}</p>
                <Stars count={review.rating} />
                <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{review.comment}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
