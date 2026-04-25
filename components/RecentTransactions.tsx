import DashboardSection from "@/components/dashboard/DashboardSection";
import { formatCurrency } from "@/libs/helper";
import { RecentTransactionDisplayRow } from "@/libs/type";

type Props = {
  rows: RecentTransactionDisplayRow[];
  isLoading?: boolean;
  subtitle?: string;
  emptyMessage?: string;
};

function RecentTransactions({
  rows,
  isLoading = false,
  subtitle = "Latest transactions",
  emptyMessage = "No transactions found for this period.",
}: Props) {
  return (
    <DashboardSection
      title="Recent Transactions"
      subtitle={subtitle}
      className="xl:col-span-2"
      contentClassName="overflow-x-auto p-0"
    >
        <table className="min-w-195 w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs uppercase tracking-[0.14em] text-gray-500 dark:bg-slate-800/70 dark:text-slate-400">
              <th className="px-5 py-3 font-semibold">Patient</th>
              <th className="px-5 py-3 font-semibold">Patient ID</th>
              <th className="px-5 py-3 font-semibold">Bill</th>
              <th className="px-5 py-3 font-semibold">Department</th>
              <th className="px-5 py-3 font-semibold">Amount</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Date/Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-100 dark:border-slate-800"
                >
                  <td className="px-5 py-4" colSpan={7}>
                    <div className="h-4 w-full animate-pulse rounded-full bg-gray-100 dark:bg-slate-800" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  className="px-5 py-10 text-center text-sm text-gray-500 dark:text-slate-400"
                  colSpan={7}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((tx) => (
                <tr
                  key={`${tx.patientId}-${tx.createdAt}-${tx.billName}`}
                  className="border-t border-gray-100 dark:border-slate-800"
                >
                  <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-slate-100">
                    {tx.patientName}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 dark:text-slate-300">
                    {tx.patientId}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 dark:text-slate-300">
                    {tx.billName}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 dark:text-slate-300">
                    {tx.departmentName}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-slate-100">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-700 dark:bg-slate-800 dark:text-slate-200">
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 dark:text-slate-300">
                    {tx.createdAt}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
    </DashboardSection>
  );
}

export default RecentTransactions;
