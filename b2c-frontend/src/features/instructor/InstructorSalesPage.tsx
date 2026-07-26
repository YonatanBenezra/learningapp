'use client';

import { Button } from '@/src/components/ui/button';
import { Spinner } from '@/src/components/ui/spinner';
import { formatMoney } from '@/src/domain/instructor';
import { useInstructorSales } from '@/src/features/instructor/useInstructor';

export function InstructorSalesPage() {
  const { data, isLoading, isError, refetch } = useInstructorSales();
  const sales = data?.sales ?? [];

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-line bg-bg-elev p-10 text-center">
        <p className="font-semibold text-ink">Could not load sales.</p>
        <Button variant="soft" className="mt-4 rounded-lg" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h2 className="text-2xl font-bold text-ink">Sales</h2>
        <p className="mt-1 text-sm text-ink-2">All enrollments and payments for your courses.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-bg-elev shadow-soft">
        {sales.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-ink-2">
            No sales recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-line bg-bg-soft text-ink-3">
                <tr>
                  <th className="px-6 py-3 font-semibold">Course</th>
                  <th className="px-6 py-3 font-semibold">Student</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-line last:border-0">
                    <td className="px-6 py-4 font-medium text-ink">{sale.courseTitle}</td>
                    <td className="px-6 py-4 text-ink-2">{sale.studentEmail}</td>
                    <td className="px-6 py-4 font-medium text-ink">
                      {formatMoney(sale.amountCents, sale.currency)}
                    </td>
                    <td className="px-6 py-4 capitalize text-ink-2">{sale.status}</td>
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

export default InstructorSalesPage;
