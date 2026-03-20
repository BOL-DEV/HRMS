import StatusPill from "@/components/StatusPill";
import TagPill from "@/components/TagPill";
import { formatUsd } from "@/libs/helper";
import { transactions } from "@/libs/data";

function TransactionList() {
  return (
    <div className="p-5 overflow-x-auto">
      <div className="p-5 border-b border-gray-200">
        <h2 className="text-xl font-bold">All Transactions</h2>
        <p className="text-sm text-gray-600">
          {transactions.length} transactions
        </p>
      </div>

      <table className="min-w-195 w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600 bg-gray-100">
            <th className="p-3 font-semibold">Patient</th>
            <th className="p-3 font-semibold">Phone</th>
            <th className="p-3 font-semibold">Invoice No</th>
            <th className="p-3 font-semibold">Revenue Head</th>
            <th className="p-3 font-semibold">Description</th>
            <th className="p-3 font-semibold">Amount</th>
            <th className="p-3 font-semibold">Payment</th>
            <th className="p-3 font-semibold">Date/Time</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-b border-gray-100">
              <td className="p-3 font-semibold text-gray-900">{t.patient}</td>
              <td className="p-3 text-gray-700">{t.phone}</td>
              <td className="p-3 text-gray-700">{t.invoiceNo}</td>
              <td className="p-3 text-gray-700">{t.revenueHead}</td>
              <td className="p-3 text-gray-700">{t.despcription}</td>
              <td className="p-3 text-gray-900 font-semibold">
                {formatUsd(t.amount)}
              </td>
              <td className="p-3">
                <TagPill label={t.payment} />
              </td>
              <td className="p-3 text-gray-700">{t.dateTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionList;
