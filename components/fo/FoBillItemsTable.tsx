import StatusPill from "@/components/shared/StatusPill";
import { formatNaira } from "@/libs/helper";
import type { FoBillItem } from "@/libs/type";

type Props = {
  rows: FoBillItem[];
  isLoading?: boolean;
  onEdit: (item: FoBillItem) => void;
  pagination?: {
    page: number;
    total_pages: number;
    has_previous_page: boolean;
    has_next_page: boolean;
  } | null;
  onPageChange?: (page: number) => void;
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

function FoBillItemsTable({
  rows,
  isLoading = false,
  onEdit,
  pagination,
  onPageChange,
}: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
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
            <tr className="bg-gray-100 text-left text-gray-600 dark:bg-panel-strong dark:text-slate-300">
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
                  className="border-b border-gray-100 dark:border-line-subtle"
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
                      className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-line-subtle dark:text-slate-200 dark:hover:bg-panel-strong"
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

      {pagination && pagination.total_pages > 0 ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 text-sm dark:border-line-subtle md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Page {pagination.page} of {pagination.total_pages}
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!pagination.has_previous_page}
              onClick={() => onPageChange?.(Math.max(pagination.page - 1, 1))}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-line-subtle dark:bg-panel dark:text-slate-200 dark:hover:bg-panel-strong"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!pagination.has_next_page}
              onClick={() => onPageChange?.(pagination.page + 1)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-line-subtle dark:bg-panel dark:text-slate-200 dark:hover:bg-panel-strong"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default FoBillItemsTable;
