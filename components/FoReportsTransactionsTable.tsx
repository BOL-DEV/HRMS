import TagPill from "@/components/TagPill";
import { formatDateTime, formatNaira } from "@/libs/helper";
import type { FoDetailedReportItem, FoReportPaymentType } from "@/libs/type";

type PaymentMethod = "Cash" | "Transfer" | "POS";

type Props = {
  rows: FoDetailedReportItem[];
  toMethodLabel: (value: FoReportPaymentType) => PaymentMethod;
};

function FoReportsTransactionsTable({ rows, toMethodLabel }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-4 text-lg font-bold dark:text-slate-100">
        Top Transactions
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
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
                  className="border-b border-gray-100 dark:border-slate-800"
                >
                  <td className="p-3 font-semibold text-gray-900 whitespace-nowrap dark:text-slate-100">
                    {item.receipt_no}
                  </td>
                  <td className="p-3 text-gray-900 font-semibold whitespace-nowrap dark:text-slate-100">
                    {item.patient_name}
                  </td>
                  <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {formatNaira(item.amount)}
                  </td>
                  <td className="p-3 text-gray-700 whitespace-nowrap dark:text-slate-300">
                    {item.department_name}
                  </td>
                  <td className="p-3">
                    <TagPill label={toMethodLabel(item.payment_type)} />
                  </td>
                  <td className="p-3 text-gray-700 whitespace-nowrap dark:text-slate-300">
                    {item.agent_name}
                  </td>
                  <td className="p-3 text-gray-700 whitespace-nowrap dark:text-slate-300">
                    {formatDateTime(item.created_at)}
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
