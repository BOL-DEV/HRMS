import DashboardSection from "@/components/dashboard/DashboardSection";
import StatusPill from "@/components/StatusPill";
import { formatNaira } from "@/libs/helper";

type HospitalRow = {
  id: string;
  name: string;
  revenue: number;
  transactions: number;
  agents: number;
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
      subtitle="Highest performing hospitals on the platform"
      accent="admin"
      contentClassName="overflow-x-auto p-0"
    >
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs uppercase tracking-[0.14em] text-gray-500 dark:bg-slate-800/70 dark:text-slate-400">
              <th className="px-5 py-3 font-semibold">Hospital Name</th>
              <th className="px-5 py-3 font-semibold">Revenue</th>
              <th className="px-5 py-3 font-semibold">Transactions</th>
              <th className="px-5 py-3 font-semibold">Agents</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-100 dark:border-slate-800"
                >
                  <td className="px-5 py-4" colSpan={5}>
                    <div className="h-4 w-full animate-pulse rounded-full bg-gray-100 dark:bg-slate-800" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  className="px-5 py-10 text-center text-sm text-gray-500 dark:text-slate-400"
                  colSpan={5}
                >
                  No hospital ranking data available.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-gray-100 dark:border-slate-800"
                >
                  <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-gray-900 dark:text-slate-100">
                    {row.name}
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
