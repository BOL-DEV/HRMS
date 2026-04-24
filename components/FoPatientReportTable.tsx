import { formatDateTime, formatNaira } from "@/libs/helper";
import type { FoPatientReportTransaction } from "@/libs/type";

type Props = {
  rows: FoPatientReportTransaction[];
};

function FoPatientReportTable({ rows }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-4 text-lg font-bold dark:text-slate-100">
        Patient Transactions
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
              <th className="p-3 font-semibold">Patient ID</th>
              <th className="p-3 font-semibold">Patient Name</th>
              <th className="p-3 font-semibold">Department</th>
              <th className="p-3 font-semibold">Income Head</th>
              <th className="p-3 font-semibold">Bill Name</th>
              <th className="p-3 font-semibold">Amount</th>
              <th className="p-3 font-semibold">Agent</th>
              <th className="p-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className="p-4 text-gray-500 dark:text-slate-400"
                  colSpan={8}
                >
                  No patient transactions available for the current filters.
                </td>
              </tr>
            ) : (
              rows.map((item, index) => (
                <tr
                  key={`${item.patient_id}-${item.date_time}-${index}`}
                  className="border-b border-gray-100 dark:border-slate-800"
                >
                  <td className="p-3 font-semibold whitespace-nowrap text-gray-900 dark:text-slate-100">
                    {item.patient_id}
                  </td>
                  <td className="p-3 font-semibold whitespace-nowrap text-gray-900 dark:text-slate-100">
                    {item.patient_name}
                  </td>
                  <td className="p-3 whitespace-nowrap text-gray-700 dark:text-slate-300">
                    {item.department}
                  </td>
                  <td className="p-3 whitespace-nowrap text-gray-700 dark:text-slate-300">
                    {item.income_head}
                  </td>
                  <td className="p-3 whitespace-nowrap text-gray-700 dark:text-slate-300">
                    {item.bill_name}
                  </td>
                  <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {formatNaira(item.amount)}
                  </td>
                  <td className="p-3 whitespace-nowrap text-gray-700 dark:text-slate-300">
                    {item.agent_name}
                  </td>
                  <td className="p-3 whitespace-nowrap text-gray-700 dark:text-slate-300">
                    {formatDateTime(item.date_time)}
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

export default FoPatientReportTable;
