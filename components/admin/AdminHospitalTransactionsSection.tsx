import AdminDateRangeFilterBar from "@/components/admin/AdminDateRangeFilterBar";
import AdminSearchField from "@/components/admin/AdminSearchField";
import { formatDateTime, formatNaira } from "@/libs/helper";
import type {
  AdminHospitalPatientSearchItem,
  AdminHospitalTransactionItem,
} from "@/libs/type";
import { FiDownload } from "react-icons/fi";

type Props = {
  rows: AdminHospitalTransactionItem[];
  search: string;
  paymentMethod: "all" | "cash" | "transfer" | "pos";
  patientId: string;
  patientSuggestions?: AdminHospitalPatientSearchItem[];
  isPatientSuggestionsLoading?: boolean;
  department: string;
  departmentOptions?: string[];
  agent: string;
  agentOptions?: string[];
  startDate: string;
  endDate: string;
  isLoading?: boolean;
  isDateRangeInvalid: boolean;
  onSearchChange: (value: string) => void;
  onPaymentMethodChange: (value: "all" | "cash" | "transfer" | "pos") => void;
  onPatientIdChange: (value: string) => void;
  onSelectPatientId?: (value: string) => void;
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
  patientSuggestions = [],
  isPatientSuggestionsLoading = false,
  department,
  departmentOptions = [],
  agent,
  agentOptions = [],
  startDate,
  endDate,
  isLoading = false,
  isDateRangeInvalid,
  onSearchChange,
  onPaymentMethodChange,
  onPatientIdChange,
  onSelectPatientId,
  onDepartmentChange,
  onAgentChange,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onClear,
  onExport,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line-subtle bg-panel shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <div className="border-b border-line-subtle p-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
          Transactions
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Search by receipt, patient, department, or agent and export filtered results
        </p>
      </div>

      <div className="flex flex-col gap-4 border-b border-line-subtle p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <AdminSearchField
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search receipt ID"
            className="w-full max-w-none"
          />

          <div className="relative w-full">
            <input
              value={patientId}
              onChange={(event) => onPatientIdChange(event.target.value)}
              placeholder="Patient ID"
              className="w-full rounded-xl border border-line-subtle bg-canvas-alt px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
            />

            {patientId.trim() ? (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-line-subtle bg-panel shadow-lg">
                {isPatientSuggestionsLoading ? (
                  <div className="p-3 text-sm text-gray-600 dark:text-slate-300">
                    Searching...
                  </div>
                ) : patientSuggestions.length === 0 ? (
                  <div className="p-3 text-sm text-gray-600 dark:text-slate-300">
                    No matches
                  </div>
                ) : (
                  <ul className="max-h-64 overflow-y-auto">
                    {patientSuggestions.map((patient) => (
                      <li key={patient.id}>
                        <button
                          type="button"
                          onClick={() => {
                            const nextValue = patient.patient_id;
                            onSelectPatientId?.(nextValue);
                            onPatientIdChange(nextValue);
                          }}
                          className="flex w-full flex-col gap-1 border-b border-line-subtle px-4 py-3 text-left text-sm hover:bg-panel-muted dark:hover:bg-panel-strong"
                        >
                          <span className="font-semibold text-gray-900 dark:text-slate-100">
                            {patient.patient_name} ({patient.patient_id})
                          </span>
                          <span className="text-xs text-gray-600 dark:text-slate-300">
                            {patient.phone_number}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>

          <select
            value={department}
            onChange={(event) => onDepartmentChange(event.target.value)}
            className="w-full rounded-xl border border-line-subtle bg-canvas-alt px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
          >
            <option value="">All Departments</option>
            {departmentOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={agent}
            onChange={(event) => onAgentChange(event.target.value)}
            className="w-full rounded-xl border border-line-subtle bg-canvas-alt px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
          >
            <option value="">All Agents</option>
            {agentOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={paymentMethod}
            onChange={(event) =>
              onPaymentMethodChange(
                event.target.value as "all" | "cash" | "transfer" | "pos",
              )
            }
            className="w-full rounded-xl border border-line-subtle bg-canvas-alt px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
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
            className="inline-flex items-center gap-2 rounded-xl border border-line-subtle bg-panel px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-panel-muted dark:text-slate-200 dark:hover:bg-panel-strong"
          >
            <FiDownload />
            Export CSV
          </button>
        }
      />

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-panel-muted text-left text-gray-600 dark:text-slate-300">
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
                    className="border-b border-line-subtle"
                  >
                    <td colSpan={10} className="p-3">
                      <div className="h-10 animate-pulse rounded-xl bg-panel-muted" />
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
                      className="border-b border-line-subtle"
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
