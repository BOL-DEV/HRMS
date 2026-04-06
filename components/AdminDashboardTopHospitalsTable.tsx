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
};

function AdminDashboardTopHospitalsTable({ rows }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-gray-200 p-5 dark:border-slate-700">
        <h2 className="text-xl font-bold">Top Hospitals</h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Highest performing hospitals on the platform
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
              <th className="p-3 font-semibold">Hospital Name</th>
              <th className="p-3 font-semibold">Revenue</th>
              <th className="p-3 font-semibold">Transactions</th>
              <th className="p-3 font-semibold">Agents</th>
              <th className="p-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className="p-4 text-gray-500 dark:text-slate-400"
                  colSpan={5}
                >
                  No hospital ranking data available.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 dark:border-slate-800"
                >
                  <td className="whitespace-nowrap p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {row.name}
                  </td>
                  <td className="whitespace-nowrap p-3 text-gray-900 dark:text-slate-100">
                    {formatNaira(row.revenue)}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {new Intl.NumberFormat("en-NG").format(row.transactions)}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {row.agents}
                  </td>
                  <td className="p-3">
                    <StatusPill status={row.status} />
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

export default AdminDashboardTopHospitalsTable;
