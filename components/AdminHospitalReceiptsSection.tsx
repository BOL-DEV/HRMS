import AdminSearchField from "@/components/AdminSearchField";
import StatusPill from "@/components/StatusPill";
import { formatDateTime, formatNaira } from "@/libs/helper";
import type {
  AdminHospitalReceiptItem,
  AdminReceiptFilter,
} from "@/libs/type";

function toReceiptStatus(status: AdminHospitalReceiptItem["status"]) {
  if (status === "pending") return "Pending" as const;
  if (status === "approved") return "Approved" as const;
  return "Rejected" as const;
}

type Props = {
  rows: AdminHospitalReceiptItem[];
  activeTab: AdminReceiptFilter;
  query: string;
  isLoading?: boolean;
  onTabChange: (tab: AdminReceiptFilter) => void;
  onQueryChange: (value: string) => void;
  onView: (receipt: AdminHospitalReceiptItem) => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
};

function AdminHospitalReceiptsSection({
  rows,
  activeTab,
  query,
  isLoading = false,
  onTabChange,
  onQueryChange,
  onView,
  onApprove,
  onReject,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-line-subtle bg-panel">
      <div className="border-b border-line-subtle p-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
          Receipt Reprint Requests
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Review, approve, or reject hospital receipt reprint requests
        </p>
      </div>

      <div className="flex flex-col gap-4 border-b border-line-subtle p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "approved", "rejected"] as AdminReceiptFilter[]).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={
                  activeTab === tab
                    ? "rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
                    : "rounded-lg border border-line-subtle bg-panel px-4 py-2 text-sm font-medium text-gray-700 hover:bg-panel-muted dark:text-slate-200"
                }
              >
                {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ),
          )}
        </div>

        <AdminSearchField
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search receipts"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-panel-muted text-left text-gray-600 dark:text-slate-300">
              <th className="p-3 font-semibold">Receipt No</th>
              <th className="p-3 font-semibold">Patient</th>
              <th className="p-3 font-semibold">Amount</th>
              <th className="p-3 font-semibold">Agent</th>
              <th className="p-3 font-semibold">Requested At</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr
                    key={index}
                    className="border-b border-line-subtle"
                  >
                    <td colSpan={7} className="p-3">
                      <div className="h-10 animate-pulse rounded-lg bg-panel-muted" />
                    </td>
                  </tr>
                ))
              : rows.length === 0
                ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-sm text-gray-500 dark:text-slate-400"
                      >
                        No receipt requests found for the current filter.
                      </td>
                    </tr>
                  )
                : rows.map((receipt) => (
                    <tr
                      key={receipt.request_id}
                      className="border-b border-line-subtle"
                    >
                      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {receipt.receipt_no}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {receipt.patient_name}
                      </td>
                      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {formatNaira(receipt.amount)}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        <p>{receipt.agent_name}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {receipt.agent_email}
                        </p>
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {formatDateTime(receipt.requested_at)}
                      </td>
                      <td className="p-3">
                        <StatusPill status={toReceiptStatus(receipt.status)} />
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onView(receipt)}
                            className="rounded-lg border border-line-subtle px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-panel-muted dark:text-slate-200"
                          >
                            View
                          </button>
                          {receipt.status === "pending" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onReject(receipt.request_id)}
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => onApprove(receipt.request_id)}
                                className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:border-brand-500/40 dark:text-brand-300 dark:hover:bg-brand-500/10"
                              >
                                Approve
                              </button>
                            </>
                          ) : null}
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

export default AdminHospitalReceiptsSection;
