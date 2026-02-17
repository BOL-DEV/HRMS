import React from 'react'
import StatusPill from "@/components/StatusPill";
import { FiMoreVertical } from "react-icons/fi";
import { Transaction } from "@/libs/type";
import { formatCurrency } from "@/libs/helper";

// interface Props {}
const recentTransactions: Transaction[] = [
  {
    id: "t1",
    patient: "John Anderson",
    invoiceNo: "INV-2024-001",
    revenueHead: "Consultation",
    amount: 250,
    status: "Paid",
    dateTime: "2024-02-15 10:30 AM",
  },
  {
    id: "t2",
    patient: "Sarah Mitchell",
    invoiceNo: "INV-2024-002",
    revenueHead: "Surgery",
    amount: 1500,
    status: "Paid",
    dateTime: "2024-02-15 09:15 AM",
  },
  {
    id: "t3",
    patient: "Robert Chen",
    invoiceNo: "INV-2024-003",
    revenueHead: "Lab Work",
    amount: 350,
    status: "Pending",
    dateTime: "2024-02-14 02:45 PM",
  },
  {
    id: "t4",
    patient: "Emma Wilson",
    invoiceNo: "INV-2024-004",
    revenueHead: "X-Ray",
    amount: 150,
    status: "Paid",
    dateTime: "2024-02-14 11:20 AM",
  },
  {
    id: "t5",
    patient: "Michael Brown",
    invoiceNo: "INV-2024-005",
    revenueHead: "Follow-up Visit",
    amount: 200,
    status: "Pending",
    dateTime: "2024-02-13 03:50 PM",
  },
];





function RecentTransactions() {
    // const {} = props

    return (
     
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl">
          <div className="p-5 flex items-start justify-between border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold">Recent Transactions</h2>
              <p className="text-sm text-gray-600">Latest transactions</p>
            </div>

            <select className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium">
              <option>All</option>
              <option>Paid</option>
              <option>Pending</option>
            </select>
          </div>

          <div className="p-5 overflow-x-auto">
            <table className="min-w-195 w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 bg-gray-100">
                  <th className="p-3 font-semibold">Patient</th>
                  <th className="p-3 font-semibold">Invoice No</th>
                  <th className="p-3 font-semibold">Revenue Head</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Date/Time</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100">
                    <td className="p-3 font-medium text-gray-900">
                      {tx.patient}
                    </td>
                    <td className="p-3 text-gray-700">{tx.invoiceNo}</td>
                    <td className="p-3 text-gray-700">{tx.revenueHead}</td>
                    <td className="p-3 text-gray-900 font-semibold">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(tx.amount)}
                    </td>
                    <td className="p-3">
                      <StatusPill status={tx.status} />
                    </td>
                    <td className="p-3 text-gray-700">{tx.dateTime}</td>
                    <td className="p-3 text-right">
                      <button className="p-2 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200">
                        <FiMoreVertical className="text-gray-700" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

    );
}

export default RecentTransactions
