import AdminSearchField from "@/components/AdminSearchField";
import StatusPill from "@/components/StatusPill";
import type { AdminHospitalIncomeHeadItem } from "@/libs/type";

type Props = {
  rows: AdminHospitalIncomeHeadItem[];
  search: string;
  departmentId: string;
  departmentOptions: Array<{ id: string; name: string }>;
  isLoading?: boolean;
  onSearchChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onOpenCreateModal: () => void;
  onEdit: (item: AdminHospitalIncomeHeadItem) => void;
};

function getIncomeHeadStatus(item: AdminHospitalIncomeHeadItem) {
  return item.is_active ? "Active" : "Inactive";
}

function AdminHospitalIncomeHeadsSection({
  rows,
  search,
  departmentId,
  departmentOptions,
  isLoading = false,
  onSearchChange,
  onDepartmentChange,
  onOpenCreateModal,
  onEdit,
}: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-gray-200 p-5 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
          Income Heads
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Manage revenue heads attached to hospital departments.
        </p>
      </div>

      <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
        <AdminSearchField
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search income heads"
        />

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={departmentId}
            onChange={(event) => onDepartmentChange(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="All">All Departments</option>
            {departmentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Income Head
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
              <th className="p-3 font-semibold">Income Head</th>
              <th className="p-3 font-semibold">Department</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="p-4 text-gray-500 dark:text-slate-400" colSpan={4}>
                  Loading income heads...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-4 text-gray-500 dark:text-slate-400" colSpan={4}>
                  No income heads found for the current filters.
                </td>
              </tr>
            ) : (
              rows.map((item) => (
                <tr
                  key={item.income_head_id}
                  className="border-b border-gray-100 dark:border-slate-800"
                >
                  <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {item.name}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {item.department_name}
                  </td>
                  <td className="p-3">
                    <StatusPill status={getIncomeHeadStatus(item)} />
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Edit
                    </button>
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

export default AdminHospitalIncomeHeadsSection;
