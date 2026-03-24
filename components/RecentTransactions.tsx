import { formatCurrency } from "@/libs/helper";
// import { Recent } from "@/libs/type";

type RecentTransactionRow = {
  id: string;
  patientName: string;
  phoneNumber: string;
  billDescription: string;
  departmentName: string;
  amount: number;
  status: string;
  createdAt: string;
};

type Props = {
  rows: RecentTransactionRow[];
  isLoading?: boolean;
  emptyMessage?: string;
};

function RecentTransactions({
  rows,
  isLoading = false,
  emptyMessage = "No transactions found for this period.",
}: Props) {
  return (
    <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl dark:border-slate-700 dark:bg-slate-900">
      <div className="p-5 flex items-start justify-between border-b border-gray-200 dark:border-slate-700">
        <div>
          <h2 className="text-xl font-bold">Recent Transactions</h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Latest agent transactions
          </p>
        </div>
      </div>

      <div className="p-5 overflow-x-auto">
        <table className="min-w-195 w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 bg-gray-100 dark:bg-slate-800 dark:text-slate-300">
              <th className="p-3 font-semibold">Patient</th>
              <th className="p-3 font-semibold">Phone</th>
              <th className="p-3 font-semibold">Bill</th>
              <th className="p-3 font-semibold">Department</th>
              <th className="p-3 font-semibold">Amount</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Date/Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  className="p-4 text-gray-500 dark:text-slate-400"
                  colSpan={7}
                >
                  Loading transactions...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  className="p-4 text-gray-500 dark:text-slate-400"
                  colSpan={7}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-gray-100 dark:border-slate-800"
                >
                  <td className="p-3 font-medium text-gray-900 dark:text-slate-100">
                    {tx.patientName}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {tx.phoneNumber}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {tx.billDescription}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {tx.departmentName}
                  </td>
                  <td className="p-3 text-gray-900 font-semibold dark:text-slate-100">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:bg-slate-800 dark:text-slate-200">
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {tx.createdAt}
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

export default RecentTransactions;
