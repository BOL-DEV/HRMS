import TagPill from "@/components/shared/TagPill";
import { formatDateTime, formatNaira } from "@/libs/helper";
import type { FoReportPaymentType, FoTransactionItem } from "@/libs/type";

type MethodFilter = "Cash" | "Transfer" | "POS";

type Props = {
  rows: FoTransactionItem[];
  isLoading?: boolean;
  toMethodLabel: (value: FoReportPaymentType) => MethodFilter;
};

function FoTransactionsTable({
  rows,
  isLoading = false,
  toMethodLabel,
}: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
      <h2 className="mb-4 text-lg font-bold dark:text-slate-100">
        Transaction History
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600 dark:bg-panel-strong dark:text-slate-300">
              <th className="p-3 font-semibold">Date/Time</th>
              <th className="p-3 font-semibold">Receipt No</th>
              <th className="p-3 font-semibold">Patient</th>
              <th className="p-3 font-semibold">Department</th>
              <th className="p-3 font-semibold">Bill Description</th>
              <th className="p-3 font-semibold">Amount</th>
              <th className="p-3 font-semibold">Method</th>
              <th className="p-3 font-semibold">Agent</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  className="p-4 text-gray-500 dark:text-slate-400"
                  colSpan={8}
                >
                  Loading transactions...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  className="p-4 text-gray-500 dark:text-slate-400"
                  colSpan={8}
                >
                  No transactions found for the current filters.
                </td>
              </tr>
            ) : (
              rows.map((item) => (
                <tr
                  key={item.transaction_id}
                  className="border-b border-gray-100 dark:border-line-subtle"
                >
                  <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
                    {formatDateTime(item.date_time)}
                  </td>
                  <td className="whitespace-nowrap p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {item.receipt_id}
                  </td>
                  <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {item.patient_name}
                    <p className="text-xs font-normal text-gray-500 dark:text-slate-400">
                      Patient ID: {item.patient_id}
                    </p>
                  </td>
                  <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
                    {item.department}
                  </td>
                  <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
                    {item.bill_name}
                  </td>
                  <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {formatNaira(item.amount)}
                  </td>
                  <td className="p-3">
                    <TagPill label={toMethodLabel(item.payment_method)} />
                  </td>
                  <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
                    {item.agent}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FoTransactionsTable;
