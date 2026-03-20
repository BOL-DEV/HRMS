"use client";

import Header from "@/components/Header";
import TagPill from "@/components/TagPill";
import { TransactionRow } from "@/libs/type";
import { useMemo, useState } from "react";
import { FiDownload, FiMoreVertical, FiSearch } from "react-icons/fi";

type MethodFilter = "All" | TransactionRow["payment"];
type DateFilter = "All" | "Today";

type TransactionItem = TransactionRow & {
  agent: string;
};

const transactionsData: TransactionItem[] = [
  {
    id: "t1",
    patient: "Chioma Okonkwo",
    phone: "+234 803 445 6789",
    invoiceNo: "INV-2024-0001",
    revenueHead: "Consultation",
    amount: 45000,
    payment: "Cash",
    dateTime: "2024-03-18 14:32",
    agent: "Oluwaseun Adeyemi",
  },
  {
    id: "t2",
    patient: "Emeka Obi",
    phone: "+234 805 234 5678",
    invoiceNo: "INV-2024-0002",
    revenueHead: "Lab Test",
    amount: 28000,
    payment: "Transfer",
    dateTime: "2024-03-18 11:45",
    agent: "Amara Okoro",
  },
  {
    id: "t3",
    patient: "Tunde Akinola",
    phone: "+234 812 987 6543",
    invoiceNo: "INV-2024-0003",
    revenueHead: "Admission",
    amount: 125000,
    payment: "POS",
    dateTime: "2024-03-17 16:20",
    agent: "Zainab Mohammed",
  },
  {
    id: "t4",
    patient: "Ngozi Eze",
    phone: "+234 816 543 2109",
    invoiceNo: "INV-2024-0004",
    revenueHead: "Scan",
    amount: 65000,
    payment: "Cash",
    dateTime: "2024-03-18 09:10",
    agent: "Chinedu Nwankwo",
  },
  {
    id: "t5",
    patient: "Binta Ibrahim",
    phone: "+234 902 765 4321",
    invoiceNo: "INV-2024-0005",
    revenueHead: "Drugs",
    amount: 35000,
    payment: "Transfer",
    dateTime: "2024-03-18 13:55",
    agent: "Oluwaseun Adeyemi",
  },
];

const getDateKey = (dateTime: string) => dateTime.split(" ")[0];

const formatNaira = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(value);

function Page() {
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<MethodFilter>("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All");

  const latestDateKey = useMemo(() => {
    const keys = transactionsData
      .map((t) => getDateKey(t.dateTime))
      .filter(Boolean);
    return keys.sort().at(-1) ?? "";
  }, []);

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();

    const bySearch = !text
      ? transactionsData
      : transactionsData.filter((t) =>
          [t.patient, t.phone, t.invoiceNo, t.agent].some((field) =>
            field.toLowerCase().includes(text),
          ),
        );

    const byMethod =
      method === "All"
        ? bySearch
        : bySearch.filter((t) => t.payment === method);

    const byDate =
      dateFilter === "Today" && latestDateKey
        ? byMethod.filter((t) => getDateKey(t.dateTime) === latestDateKey)
        : byMethod;

    return [...byDate].sort((a, b) => b.dateTime.localeCompare(a.dateTime));
  }, [search, method, dateFilter, latestDateKey]);

  const stats = useMemo(() => {
    const totalRevenue = filtered.reduce((sum, t) => sum + t.amount, 0);
    return { totalRevenue, totalTransactions: filtered.length };
  }, [filtered]);

  const exportFilename = useMemo(() => {
    const dateSuffix =
      dateFilter === "Today" && latestDateKey ? latestDateKey : "all";
    const methodSuffix = method === "All" ? "all" : method.toLowerCase();
    return `transactions_${dateSuffix}_${methodSuffix}.csv`;
  }, [dateFilter, latestDateKey, method]);

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <Header
        title="Transactions"
        Subtitle="Monitor and audit all hospital payment transactions"
        actions={
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium md:block hidden">
            Export CSV
          </button>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            {
              label: "Total Revenue",
              value: formatNaira(stats.totalRevenue),
            },
            {
              label: "Total Transactions",
              value: stats.totalTransactions,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <p className="text-sm text-gray-600 font-medium">{card.label}</p>
              <h2 className="text-2xl font-bold mt-2">{card.value}</h2>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3 w-full">
            <div className="relative w-full">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by patient name, phone, or invoice..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as MethodFilter)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="All">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Transfer">Transfer</option>
                <option value="POS">POS</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
              </select>
            </div>

            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-50 self-start md:self-auto">
              <FiDownload />
              Export
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-lg font-bold mb-4">Transaction History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 bg-gray-100">
                  <th className="p-3 font-semibold">Date/Time</th>
                  <th className="p-3 font-semibold">Invoice No</th>
                  <th className="p-3 font-semibold">Patient</th>
                  <th className="p-3 font-semibold">Revenue Head</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Method</th>
                  <th className="p-3 font-semibold">Agent</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100">
                    <td className="p-3 text-gray-700 whitespace-nowrap">
                      {t.dateTime}
                    </td>
                    <td className="p-3 font-semibold text-gray-900 whitespace-nowrap">
                      {t.invoiceNo}
                    </td>
                    <td className="p-3 text-gray-900 font-semibold whitespace-nowrap">
                      {t.patient}
                      <p className="text-xs text-gray-500">{t.phone}</p>
                    </td>
                    <td className="p-3 text-gray-700 whitespace-nowrap">
                      {t.revenueHead}
                    </td>
                    <td className="p-3 text-gray-900 font-semibold">
                      {formatNaira(t.amount)}
                    </td>
                    <td className="p-3">
                      <TagPill label={t.payment} />
                    </td>
                    <td className="p-3 text-gray-700 whitespace-nowrap">
                      {t.agent}
                    </td>
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
      </div>
    </div>
  );
}

export default Page;
