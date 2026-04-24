import AdminDateRangeFilterBar from "@/components/AdminDateRangeFilterBar";
import AdminSearchField from "@/components/AdminSearchField";
import { formatDateTime, formatNaira } from "@/libs/helper";
import type { AdminHospitalTransactionItem } from "@/libs/type";
import { FiDownload } from "react-icons/fi";

type Props = {
  rows: AdminHospitalTransactionItem[];
  search: string;
  paymentMethod: "all" | "cash" | "transfer" | "pos";
  patientId: string;
  department: string;
  agent: string;
  startDate: string;
  endDate: string;
  isLoading?: boolean;
  isDateRangeInvalid: boolean;
  onSearchChange: (value: string) => void;
  onPaymentMethodChange: (value: "all" | "cash" | "transfer" | "pos") => void;
  onPatientIdChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onAgentChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
  onExport: () => void;
};

function formatPaymentMethod(value?: "cash" | "transfer" | "pos") {
  if (value === "transfer") return "Transfer";
  if (value === "pos") return "POS";
  if (value === "cash") return "Cash";
  return "-";
}

function AdminHospitalTransactionsSection({
  rows,
  search,
  paymentMethod,
  patientId,
  department,
  agent,
  startDate,
  endDate,
  isLoading = false,
  isDateRangeInvalid,
  onSearchChange,
  onPaymentMethodChange,
  onPatientIdChange,
  onDepartmentChange,
  onAgentChange,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onClear,
  onExport,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-gray-200 p-5 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
          Transactions
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Search by receipt, patient, department, or agent and export filtered results
        </p>
      </div>

      <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-slate-700">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <AdminSearchField
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search receipt ID"
            className="w-full max-w-none"
          />

          <input
            value={patientId}
            onChange={(event) => onPatientIdChange(event.target.value)}
            placeholder="Patient ID"
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />

          <input
            value={department}
            onChange={(event) => onDepartmentChange(event.target.value)}
            placeholder="Department"
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />

          <input
            value={agent}
            onChange={(event) => onAgentChange(event.target.value)}
            placeholder="Agent"
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />

          <select
            value={paymentMethod}
            onChange={(event) =>
              onPaymentMethodChange(
                event.target.value as "all" | "cash" | "transfer" | "pos",
              )
            }
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="transfer">Transfer</option>
            <option value="pos">POS</option>
          </select>
        </div>
      </div>

      <AdminDateRangeFilterBar
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        onApply={onApply}
        onClear={onClear}
        isInvalid={isDateRangeInvalid}
        leadSlot={
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FiDownload />
            Export CSV
          </button>
        }
      />

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
              <th className="p-3 font-semibold">Date/Time</th>
              <th className="p-3 font-semibold">Receipt ID</th>
              <th className="p-3 font-semibold">Patient ID</th>
              <th className="p-3 font-semibold">Patient</th>
              <th className="p-3 font-semibold">Department</th>
              <th className="p-3 font-semibold">Income Head</th>
              <th className="p-3 font-semibold">Bill Name</th>
              <th className="p-3 font-semibold">Payment</th>
              <th className="p-3 font-semibold">Amount</th>
              <th className="p-3 font-semibold">Agent</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 dark:border-slate-800"
                  >
                    <td colSpan={10} className="p-3">
                      <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              : rows.length === 0
                ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="p-8 text-center text-sm text-gray-500 dark:text-slate-400"
                      >
                        No transactions found for the current filters.
                      </td>
                    </tr>
                  )
                : rows.map((transaction) => (
                    <tr
                      key={`${transaction.receipt_id}-${transaction.date_time}`}
                      className="border-b border-gray-100 dark:border-slate-800"
                    >
                      <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
                        {formatDateTime(transaction.date_time)}
                      </td>
                      <td className="whitespace-nowrap p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {transaction.receipt_id}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {transaction.patient_id ?? "-"}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {transaction.patient_name}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {transaction.department ?? "-"}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {transaction.income_head ?? "-"}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {transaction.bill_name ?? "-"}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {formatPaymentMethod(transaction.payment_method)}
                      </td>
                      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {formatNaira(transaction.amount)}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {transaction.agent}
                      </td>
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminHospitalTransactionsSection;
