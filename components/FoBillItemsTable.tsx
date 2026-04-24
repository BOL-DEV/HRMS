import StatusPill from "@/components/StatusPill";
import { formatNaira } from "@/libs/helper";
import type { FoBillItem } from "@/libs/type";

type Props = {
  rows: FoBillItem[];
  isLoading?: boolean;
  onEdit: (item: FoBillItem) => void;
};

function getBillItemStatus(item: FoBillItem) {
  if (item.status === "suspended") {
    return "Suspended" as const;
  }

  if (item.status === "inactive" || item.is_active === false) {
    return "Inactive" as const;
  }

  return "Active" as const;
}

function FoBillItemsTable({ rows, isLoading = false, onEdit }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
          Bill Items
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Review and update bill items tied to departments and income heads.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
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
                <td
                  className="p-4 text-gray-500 dark:text-slate-400"
                  colSpan={6}
                >
                  Loading bill items...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  className="p-4 text-gray-500 dark:text-slate-400"
                  colSpan={6}
                >
                  No bill items found for the current filters.
                </td>
              </tr>
            ) : (
              rows.map((item) => (
                <tr
                  key={item.bill_item_id}
                  className="border-b border-gray-100 dark:border-slate-800"
                >
                  <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {item.name}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {item.department_name ?? item.department_id}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {item.income_head_name ?? item.income_head_id}
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

export default FoBillItemsTable;
