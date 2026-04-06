import StatusPill from "@/components/StatusPill";
import { formatNaira } from "@/libs/helper";
import type { AdminHospitalListItem } from "@/libs/type";
import Link from "next/link";

type Props = {
  rows: AdminHospitalListItem[];
  isLoading?: boolean;
  onEdit: (hospital: AdminHospitalListItem) => void;
};

function getStatusLabel(status: AdminHospitalListItem["status"]) {
  return status === "suspended" ? "Suspended" : "Active";
}

function AdminHospitalsTable({ rows, isLoading = false, onEdit }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-gray-200 p-5 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
          Hospitals List
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          {rows.length} hospitals found
        </p>
      </div>

      <div className="overflow-x-auto p-5">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
              <th className="p-3 font-semibold">Hospital Name</th>
              <th className="p-3 font-semibold">Code</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Phone</th>
              <th className="p-3 font-semibold">Agents</th>
              <th className="p-3 font-semibold">FOs</th>
              <th className="p-3 font-semibold">Transactions</th>
              <th className="p-3 font-semibold">Revenue</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 dark:border-slate-800"
                >
                  <td colSpan={10} className="p-3">
                    <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="p-8 text-center text-sm text-gray-500 dark:text-slate-400"
                >
                  No hospitals matched the current filters.
                </td>
              </tr>
            ) : (
              rows.map((hospital) => (
                <tr
                  key={hospital.hospital_id}
                  className="border-b border-gray-100 dark:border-slate-800"
                >
                  <td className="whitespace-nowrap p-3 font-semibold text-gray-900 dark:text-slate-100">
                    <Link
                      href={`/admin/hospitals/${hospital.hospital_id}`}
                      className="hover:underline"
                    >
                      {hospital.hospital_name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
                    {hospital.hospital_code}
                  </td>
                  <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
                    {hospital.hospital_email}
                  </td>
                  <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
                    {hospital.phone}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {hospital.agents}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {hospital.fos}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {hospital.transaction_count}
                  </td>
                  <td className="whitespace-nowrap p-3 font-semibold text-blue-700 dark:text-sky-300">
                    {formatNaira(hospital.total_revenue)}
                  </td>
                  <td className="p-3">
                    <StatusPill status={getStatusLabel(hospital.status)} />
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(hospital)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Edit
                      </button>
                      <Link
                        href={`/admin/hospitals/${hospital.hospital_id}`}
                        className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-sky-500/40 dark:text-sky-300 dark:hover:bg-sky-500/10"
                      >
                        Open
                      </Link>
                    </div>
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

export default AdminHospitalsTable;
