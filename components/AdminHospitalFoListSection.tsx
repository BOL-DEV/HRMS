import AdminSearchField from "@/components/AdminSearchField";
import StatusPill from "@/components/StatusPill";
import type { AdminHospitalFoListItem } from "@/libs/type";
import { FiUserPlus } from "react-icons/fi";

function getStatusLabel(status: AdminHospitalFoListItem["status"]) {
  return status === "suspended" ? "Suspended" : "Active";
}

type Props = {
  rows: AdminHospitalFoListItem[];
  search: string;
  isLoading?: boolean;
  onSearchChange: (value: string) => void;
  onOpenCreateModal: () => void;
  onEdit: (fo: AdminHospitalFoListItem) => void;
  onToggleStatus: (fo: AdminHospitalFoListItem) => void;
};

function AdminHospitalFoListSection({
  rows,
  search,
  isLoading = false,
  onSearchChange,
  onOpenCreateModal,
  onEdit,
  onToggleStatus,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-slate-700 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            Hospital FOs
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Create and manage financial officers for this hospital
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <FiUserPlus />
          Add FO
        </button>
      </div>

      <div className="border-b border-gray-200 p-5 dark:border-slate-700">
        <AdminSearchField
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search FOs"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
              <th className="p-3 font-semibold">Name</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Phone</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 dark:border-slate-800"
                  >
                    <td colSpan={5} className="p-3">
                      <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              : rows.length === 0
                ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-sm text-gray-500 dark:text-slate-400"
                      >
                        No FOs found for this hospital.
                      </td>
                    </tr>
                  )
                : rows.map((fo) => (
                    <tr
                      key={fo.fo_id}
                      className="border-b border-gray-100 dark:border-slate-800"
                    >
                      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {fo.fo_name}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {fo.email}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {fo.phone}
                      </td>
                      <td className="p-3">
                        <StatusPill status={getStatusLabel(fo.status)} />
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(fo)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleStatus(fo)}
                            className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-sky-500/40 dark:text-sky-300 dark:hover:bg-sky-500/10"
                          >
                            {fo.status === "suspended" ? "Reactivate" : "Suspend"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminHospitalFoListSection;
