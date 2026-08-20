'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Avatar } from '@/src/components/ui/avatar';

interface Enrollment {
  id: string;
  student: { name: string; email: string; avatar?: string };
  course: string;
  instructor: string;
  date: string;
  payment: string;
  progress: number;
  status: 'active' | 'completed' | 'pending' | 'cancelled';
}

const enrollments: Enrollment[] = [
  {
    id: '1',
    student: { name: 'Sarah Johnson', email: 'sarah@example.com' },
    course: 'Advanced React Patterns',
    instructor: 'John Smith',
    date: 'Jul 18, 2026',
    payment: '$149',
    progress: 78,
    status: 'active',
  },
  {
    id: '2',
    student: { name: 'Michael Chen', email: 'michael@example.com' },
    course: 'Node.js Masterclass',
    instructor: 'Emily Davis',
    date: 'Jul 17, 2026',
    payment: '$199',
    progress: 100,
    status: 'completed',
  },
  {
    id: '3',
    student: { name: 'Emma Wilson', email: 'emma@example.com' },
    course: 'Python for Data Science',
    instructor: 'David Brown',
    date: 'Jul 16, 2026',
    payment: '$179',
    progress: 45,
    status: 'active',
  },
  {
    id: '4',
    student: { name: 'James Rodriguez', email: 'james@example.com' },
    course: 'UI/UX Design Fundamentals',
    instructor: 'Lisa Anderson',
    date: 'Jul 15, 2026',
    payment: '$129',
    progress: 0,
    status: 'pending',
  },
  {
    id: '5',
    student: { name: 'Olivia Brown', email: 'olivia@example.com' },
    course: 'DevOps Engineering',
    instructor: 'John Smith',
    date: 'Jul 14, 2026',
    payment: '$219',
    progress: 23,
    status: 'cancelled',
  },
  {
    id: '6',
    student: { name: 'William Lee', email: 'william@example.com' },
    course: 'Cloud Architecture',
    instructor: 'Emily Davis',
    date: 'Jul 13, 2026',
    payment: '$249',
    progress: 62,
    status: 'active',
  },
];

const statusStyles: Record<string, string> = {
  active: 'bg-primary/10 text-primary',
  completed: 'bg-good-soft text-good',
  pending: 'bg-warn-soft text-warn',
  cancelled: 'bg-bad-soft text-bad',
};

const progressColors: Record<string, string> = {
  active: 'bg-primary',
  completed: 'bg-good',
  pending: 'bg-warn',
  cancelled: 'bg-bad',
};

export function EnrollmentsTable() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filtered = enrollments.filter(
    (e) =>
      e.student.name.toLowerCase().includes(search.toLowerCase()) ||
      e.course.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="rounded-2xl border border-line bg-bg-elev shadow-soft"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-5">
        <div>
          <h3 className="text-lg font-bold text-ink">Recent Enrollments</h3>
          <p className="text-sm text-ink-2">{filtered.length} total enrollments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <input
              type="text"
              placeholder="Search enrollments..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="h-9 w-56 rounded-xl border border-line-2 bg-bg pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <button className="flex h-9 items-center gap-2 rounded-xl border border-line-2 px-3 text-sm font-medium text-ink-2 transition-colors hover:border-primary hover:text-primary">
            <Filter className="size-3.5" />
            Filter
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-3">
                Student
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-3">
                Course
              </th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-3 lg:table-cell">
                Instructor
              </th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-3 md:table-cell">
                Date
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-3">
                Payment
              </th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-3 xl:table-cell">
                Progress
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-3">
                Status
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((e) => (
              <tr
                key={e.id}
                className="border-b border-line last:border-0 transition-colors hover:bg-bg-soft/50"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={e.student.name} className="size-8 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{e.student.name}</p>
                      <p className="text-xs text-ink-3 truncate">{e.student.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <p className="max-w-[200px] truncate text-sm text-ink">{e.course}</p>
                </td>
                <td className="hidden px-5 py-3.5 lg:table-cell">
                  <p className="text-sm text-ink-2">{e.instructor}</p>
                </td>
                <td className="hidden px-5 py-3.5 md:table-cell">
                  <p className="text-sm text-ink-2">{e.date}</p>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-sm font-semibold text-ink">{e.payment}</p>
                </td>
                <td className="hidden px-5 py-3.5 xl:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-line-2">
                      <div
                        className={cn('h-full rounded-full transition-all', progressColors[e.status])}
                        style={{ width: `${e.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-ink-3">{e.progress}%</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize', statusStyles[e.status])}>
                    {e.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button className="inline-flex size-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-bg-lav hover:text-ink">
                    <MoreHorizontal className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-line px-5 py-3.5">
        <p className="text-xs text-ink-3">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
          {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex size-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-bg-lav hover:text-ink disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={cn(
                'flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                currentPage === i + 1
                  ? 'bg-primary text-primary-ink'
                  : 'text-ink-3 hover:bg-bg-lav hover:text-ink',
              )}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex size-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-bg-lav hover:text-ink disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
