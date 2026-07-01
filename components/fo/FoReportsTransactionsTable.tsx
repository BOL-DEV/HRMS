import TagPill from "@/components/shared/TagPill";
import { formatDateTime, formatNaira } from "@/libs/helper";
import type { FoReportPaymentType, FoTransactionItem } from "@/libs/type";

type PaymentMethod = "Cash" | "Transfer" | "POS";

type Props = {
  rows: FoTransactionItem[];
  toMethodLabel: (value: FoReportPaymentType) => PaymentMethod;
};

function FoReportsTransactionsTable({ rows, toMethodLabel }: Props) {
  return (
    <div className="rounded-2xl border border-line-subtle bg-panel p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <h2 className="mb-4 text-lg font-bold dark:text-slate-100">
        All Transactions
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-panel-muted text-left text-gray-600 dark:text-slate-300">
              <th className="p-3 font-semibold">Receipt No</th>
              <th className="p-3 font-semibold">Patient</th>
              <th className="p-3 font-semibold">Amount</th>
              <th className="p-3 font-semibold">Department</th>
              <th className="p-3 font-semibold">Payment Method</th>
              <th className="p-3 font-semibold">Agent</th>
              <th className="p-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className="p-4 text-gray-500 dark:text-slate-400"
                  colSpan={7}
                >
                  No transactions available for the current filters.
                </td>
              </tr>
            ) : (
              rows.map((item) => (
                <tr
                  key={item.transaction_id}
                  className="border-b border-line-subtle"
                >
                  <td className="p-3 font-semibold text-gray-900 whitespace-nowrap dark:text-slate-100">
                    {item.receipt_id}
                  </td>
                  <td className="p-3 text-gray-900 font-semibold whitespace-nowrap dark:text-slate-100">
                    {item.patient_name}
                  </td>
                  <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {formatNaira(item.amount)}
                  </td>
                  <td className="p-3 text-gray-700 whitespace-nowrap dark:text-slate-300">
                    {item.department}
                  </td>
                  <td className="p-3">
                    <TagPill label={toMethodLabel(item.payment_method)} />
                  </td>
                  <td className="p-3 text-gray-700 whitespace-nowrap dark:text-slate-300">
                    {item.agent}
                  </td>
                  <td className="p-3 text-gray-700 whitespace-nowrap dark:text-slate-300">
                    {formatDateTime(item.date_time)}
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

export default FoReportsTransactionsTable;
