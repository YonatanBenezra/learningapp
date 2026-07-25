'use client';

import Link from 'next/link';
import { BookOpen, DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Spinner } from '@/src/components/ui/spinner';
import { formatMoney } from '@/src/domain/instructor';
import { useInstructorDashboard } from '@/src/features/instructor/useInstructor';

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-lg border border-line bg-bg-elev p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-2">{label}</p>
          <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
        </div>
        <span className="grid size-11 place-items-center rounded-lg bg-primary-soft text-primary">
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}

export function InstructorDashboardPage() {
  const { data, isLoading, isError, refetch } = useInstructorDashboard();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-line bg-bg-elev p-10 text-center">
        <p className="font-semibold text-ink">Could not load instructor dashboard.</p>
        <Button variant="soft" className="mt-4 rounded-lg" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const { stats, recentSales } = data;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-ink">Instructor dashboard</h2>
        <p className="mt-1 text-sm text-ink-2">
          Create courses, publish them for sale, and track your revenue here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total courses" value={String(stats.totalCourses)} icon={BookOpen} />
        <StatCard label="Published" value={String(stats.publishedCourses)} icon={TrendingUp} />
        <StatCard label="Total sales" value={String(stats.totalSales)} icon={ShoppingBag} />
        <StatCard
          label="Total revenue"
          value={formatMoney(stats.totalRevenueCents)}
          icon={DollarSign}
        />
      </div>

      <div className="rounded-lg border border-line bg-bg-elev shadow-soft">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="font-semibold text-ink">Recent sales</h3>
          <Link href="/instructor/sales" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {recentSales.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-ink-2">
            No sales yet. Publish a course to start earning.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-line bg-bg-soft text-ink-3">
                <tr>
                  <th className="px-6 py-3 font-semibold">Course</th>
                  <th className="px-6 py-3 font-semibold">Student</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-line last:border-0">
                    <td className="px-6 py-4 font-medium text-ink">{sale.courseTitle}</td>
                    <td className="px-6 py-4 text-ink-2">{sale.studentEmail}</td>
                    <td className="px-6 py-4 font-medium text-ink">
                      {formatMoney(sale.amountCents, sale.currency)}
                    </td>
                    <td className="px-6 py-4 text-ink-2">
                      {new Intl.DateTimeFormat('en', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }).format(new Date(sale.purchasedAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default InstructorDashboardPage;
