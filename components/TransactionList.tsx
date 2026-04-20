import { formatCurrency } from "@/libs/helper";
import TagPill from "@/components/TagPill";

type TransactionRow = {
  id: string;
  receiptNo: string;
  patientName: string;
  phoneNumber: string;
  department: string;
  billName: string;
  amount: number;
  paymentType: string;
  status: string;
  createdAt: string;
};

type Props = {
  rows: TransactionRow[];
  totalCount: number;
  isLoading?: boolean;
  emptyMessage?: string;
};

function TransactionList({
  rows,
  totalCount,
  isLoading = false,
  emptyMessage = "No transactions found for the selected filters.",
}: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="p-5 border-b border-gray-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          All Transactions
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-300">
          {totalCount} transactions
        </p>
      </div>

      <table className="min-w-195 w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600 bg-gray-100 dark:text-slate-300 dark:bg-slate-950">
            <th className="p-3 font-semibold">Patient</th>
            <th className="p-3 font-semibold">Phone</th>
            <th className="p-3 font-semibold">Receipt No</th>
            <th className="p-3 font-semibold">Department</th>
            <th className="p-3 font-semibold">Bill Name</th>
            <th className="p-3 font-semibold">Amount</th>
            <th className="p-3 font-semibold">Payment</th>
            <th className="p-3 font-semibold">Status</th>
            <th className="p-3 font-semibold">Date/Time</th>
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <tr>
              <td className="p-4 text-gray-500 dark:text-slate-400" colSpan={9}>
                Loading transactions...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td className="p-4 text-gray-500 dark:text-slate-400" colSpan={9}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((t) => (
              <tr
                key={t.id}
                className="border-b border-gray-100 dark:border-slate-800/60"
              >
                <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                  {t.patientName}
                </td>
                <td className="p-3 text-gray-700 dark:text-slate-200">
                  {t.phoneNumber}
                </td>
                <td className="p-3 text-gray-700 dark:text-slate-200">
                  {t.receiptNo}
                </td>
                <td className="p-3 text-gray-700 dark:text-slate-200">
                  {t.department}
                </td>
                <td className="p-3 text-gray-700 dark:text-slate-200">
                  {t.billName}
                </td>
                <td className="p-3 text-gray-900 dark:text-slate-100 font-semibold">
                  {formatCurrency(t.amount)}
                </td>
                <td className="p-3">
                  <TagPill label={t.paymentType.toUpperCase()} tone="info" />
                </td>
                <td className="p-3">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:bg-slate-800 dark:text-slate-200">
                    {t.status}
                  </span>
                </td>
                <td className="p-3 text-gray-700 dark:text-slate-200">
                  {t.createdAt}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionList;
