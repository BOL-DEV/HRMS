import AdminSearchField from "@/components/admin/AdminSearchField";
import StatusPill from "@/components/shared/StatusPill";
import { formatNaira } from "@/libs/helper";
import type { AdminHospitalBillItem } from "@/libs/type";

type Option = {
  id: string;
  name: string;
};

type Props = {
  rows: AdminHospitalBillItem[];
  search: string;
  departmentId: string;
  incomeHeadId: string;
  departmentOptions: Option[];
  incomeHeadOptions: Option[];
  isLoading?: boolean;
  onSearchChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onIncomeHeadChange: (value: string) => void;
  onOpenCreateModal: () => void;
  onEdit: (item: AdminHospitalBillItem) => void;
};

function getBillItemStatus(item: AdminHospitalBillItem) {
  return item.is_active ? "Active" : "Inactive";
}

function AdminHospitalBillItemsSection({
  rows,
  search,
  departmentId,
  incomeHeadId,
  departmentOptions,
  incomeHeadOptions,
  isLoading = false,
  onSearchChange,
  onDepartmentChange,
  onIncomeHeadChange,
  onOpenCreateModal,
  onEdit,
}: Props) {
  return (
    <div className="rounded-xl border border-line-subtle bg-panel">
      <div className="border-b border-line-subtle p-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
          Bill Items
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Create and maintain bill items linked to income heads.
        </p>
      </div>

      <div className="flex flex-col gap-4 border-b border-line-subtle p-5 lg:flex-row lg:items-center lg:justify-between">
        <AdminSearchField
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search bill items"
        />

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={departmentId}
            onChange={(event) => onDepartmentChange(event.target.value)}
            className="rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
          >
            <option value="All">All Departments</option>
            {departmentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>

          <select
            value={incomeHeadId}
            onChange={(event) => onIncomeHeadChange(event.target.value)}
            disabled={departmentId === "All"}
            className="rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-panel-muted dark:text-slate-100"
          >
            <option value="All">
              {departmentId === "All"
                ? "Select department first"
                : "All Income Heads"}
            </option>
            {incomeHeadOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Add Bill Item
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-panel-muted text-left text-gray-600 dark:text-slate-300">
              <th className="p-3 font-semibold">Bill Item</th>
              <th className="p-3 font-semibold">Department</th>
              <th className="p-3 font-semibold">Income Head</th>
              <th className="p-3 font-semibold">Amount</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="p-4 text-gray-500 dark:text-slate-400" colSpan={6}>
                  Loading bill items...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-4 text-gray-500 dark:text-slate-400" colSpan={6}>
                  No bill items found for the current filters.
                </td>
              </tr>
            ) : (
              rows.map((item) => (
                <tr
                  key={item.bill_item_id}
                  className="border-b border-line-subtle"
                >
                  <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {item.name}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {item.department_name}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {item.income_head_name}
                  </td>
                  <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {formatNaira(item.amount)}
                  </td>
                  <td className="p-3">
                    <StatusPill status={getBillItemStatus(item)} />
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="rounded-lg border border-line-subtle px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-panel-muted dark:text-slate-200"
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

export default AdminHospitalBillItemsSection;
