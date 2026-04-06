import AdminDateRangeFilterBar from "@/components/AdminDateRangeFilterBar";
import AdminSearchField from "@/components/AdminSearchField";
import { formatDateTime, formatNaira } from "@/libs/helper";
import type { AdminHospitalTransactionItem } from "@/libs/type";

type Props = {
  rows: AdminHospitalTransactionItem[];
  search: string;
  startDate: string;
  endDate: string;
  isLoading?: boolean;
  isDateRangeInvalid: boolean;
  onSearchChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
};

function AdminHospitalTransactionsSection({
  rows,
  search,
  startDate,
  endDate,
  isLoading = false,
  isDateRangeInvalid,
  onSearchChange,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onClear,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-gray-200 p-5 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
          Transactions
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Search by receipt ID and filter by exact date range
        </p>
      </div>

      <AdminDateRangeFilterBar
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        onApply={onApply}
        onClear={onClear}
        isInvalid={isDateRangeInvalid}
        leadSlot={
          <AdminSearchField
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search receipt ID"
            className="w-full"
          />
        }
      />

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
              <th className="p-3 font-semibold">Date/Time</th>
              <th className="p-3 font-semibold">Receipt ID</th>
              <th className="p-3 font-semibold">Patient</th>
              <th className="p-3 font-semibold">Revenue Head</th>
              <th className="p-3 font-semibold">Amount</th>
              <th className="p-3 font-semibold">Agent</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 dark:border-slate-800"
                  >
                    <td colSpan={6} className="p-3">
                      <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              : rows.length === 0
                ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-sm text-gray-500 dark:text-slate-400"
                      >
                        No transactions found for the current filters.
                      </td>
                    </tr>
                  )
                : rows.map((transaction) => (
                    <tr
                      key={`${transaction.receipt_id}-${transaction.date_time}`}
                      className="border-b border-gray-100 dark:border-slate-800"
                    >
                      <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
                        {formatDateTime(transaction.date_time)}
                      </td>
                      <td className="whitespace-nowrap p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {transaction.receipt_id}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {transaction.patient_name}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {transaction.revenue_head}
                      </td>
                      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {formatNaira(transaction.amount)}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {transaction.agent}
                      </td>
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminHospitalTransactionsSection;
