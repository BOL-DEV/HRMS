import { formatNaira } from "@/libs/helper";

type Row = {
  revenueHead: string;
  department: string;
  transactions: number;
  totalRevenue: number;
};

type Props = {
  rows: Row[];
  title?: string;
  primaryColumnLabel?: string;
  secondaryColumnLabel?: string;
  hideSecondaryColumn?: boolean;
  emptyMessage?: string;
};

function FoReportsRevenueBreakdownTable({
  rows,
  title = "Detailed Revenue Breakdown",
  primaryColumnLabel = "Revenue Head",
  secondaryColumnLabel = "Department",
  hideSecondaryColumn = false,
  emptyMessage = "No revenue breakdown available for the current filters.",
}: Props) {
  const columnCount = hideSecondaryColumn ? 3 : 4;

  return (
    <div className="rounded-2xl border border-line-subtle bg-panel p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <h2 className="mb-4 text-lg font-bold dark:text-slate-100">
        {title}
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-panel-muted text-left text-gray-600 dark:text-slate-300">
              <th className="p-3 font-semibold">{primaryColumnLabel}</th>
              {!hideSecondaryColumn ? (
                <th className="p-3 font-semibold">{secondaryColumnLabel}</th>
              ) : null}
              <th className="p-3 font-semibold">Transactions</th>
              <th className="p-3 font-semibold">Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className="p-4 text-gray-500 dark:text-slate-400"
                  colSpan={columnCount}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={`${row.revenueHead}-${row.department}`}
                  className="border-b border-line-subtle"
                >
                  <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {row.revenueHead}
                  </td>
                  {!hideSecondaryColumn ? (
                    <td className="p-3 text-gray-700 dark:text-slate-300">
                      {row.department}
                    </td>
                  ) : null}
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {row.transactions}
                  </td>
                  <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {formatNaira(row.totalRevenue)}
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

export default FoReportsRevenueBreakdownTable;
