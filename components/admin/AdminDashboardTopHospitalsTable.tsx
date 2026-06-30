import DashboardSection from "@/components/dashboard/DashboardSection";
import StatusPill from "@/components/shared/StatusPill";
import { formatNaira } from "@/libs/helper";

type HospitalRow = {
  id: string;
  name: string;
  code: string;
  revenueType: string;
  revenue: number;
  transactions: number;
  agents: number;
  pendingReceiptReprints: number;
  status: "Active" | "Inactive" | "Suspended";
};

type Props = {
  rows: HospitalRow[];
  isLoading?: boolean;
};

function AdminDashboardTopHospitalsTable({ rows, isLoading = false }: Props) {
  return (
    <DashboardSection
      title="Top Hospitals"
      subtitle="Current-month ranking across the platform"
      accent="admin"
      contentClassName="overflow-x-auto p-0"
    >
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-panel-muted text-left text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-slate-400">
            <th className="px-5 py-3 font-semibold">Hospital</th>
            <th className="px-5 py-3 font-semibold">Revenue Type</th>
            <th className="px-5 py-3 font-semibold">Revenue</th>
            <th className="px-5 py-3 font-semibold">Transactions</th>
            <th className="px-5 py-3 font-semibold">Agents</th>
            <th className="px-5 py-3 font-semibold">Reprints</th>
            <th className="px-5 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <tr
                key={index}
                className="border-t border-line-subtle"
              >
                <td className="px-5 py-4" colSpan={7}>
                  <div className="h-4 w-full animate-pulse rounded-full bg-panel-muted" />
                </td>
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td
                className="px-5 py-10 text-center text-sm text-gray-500 dark:text-slate-400"
                colSpan={7}
              >
                No hospital ranking data available.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-line-subtle"
              >
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-gray-900 dark:text-slate-100">
                    {row.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">
                    {row.code}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-600 dark:text-slate-300">
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                    {row.revenueType}
                  </span>
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-gray-900 dark:text-slate-100">
                  {formatNaira(row.revenue)}
                </td>
                <td className="px-5 py-3.5 text-gray-600 dark:text-slate-300">
                  {new Intl.NumberFormat("en-NG").format(row.transactions)}
                </td>
                <td className="px-5 py-3.5 text-gray-600 dark:text-slate-300">
                  {row.agents}
                </td>
                <td className="px-5 py-3.5 text-gray-600 dark:text-slate-300">
                  {row.pendingReceiptReprints}
                </td>
                <td className="px-5 py-3.5">
                  <StatusPill status={row.status} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </DashboardSection>
  );
}

export default AdminDashboardTopHospitalsTable;
