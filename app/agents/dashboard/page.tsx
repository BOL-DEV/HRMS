import React from "react";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import StatusPill from "@/components/StatusPill";
import RevenueBarChart from "@/components/RevenueBarChart";
import {
  FiClock,
  FiDollarSign,
  FiFileText,
  FiPlus,
  FiPrinter,
  FiRefreshCcw,
  FiUserPlus,
  FiMoreVertical,
} from "react-icons/fi";
import { formatCurrency, formatCompactNumber } from "@/libs/helper";
import { Transaction } from "@/libs/type";
import RecentTransactions from "@/components/RecentTransactions";
import RevenueTrend from "@/components/RevenueTrend";
import TopAgents from "@/components/TopAgents";

function Page() {
  const timeRange = "Today";

  const stats = [
    {
      title: "Revenue (Today)",
      value: formatCurrency(12450),
      delta: "+12.5%",
      deltaTone: "positive" as const,
      icon: <FiDollarSign className="text-xl" />,
    },
    {
      title: "Transactions (Today)",
      value: formatCompactNumber(248),
      delta: "+8.2%",
      deltaTone: "positive" as const,
      icon: <FiFileText className="text-xl" />,
    },
    {
      title: "Pending Payments",
      value: formatCompactNumber(34),
      delta: "-2.4%",
      deltaTone: "negative" as const,
      icon: <FiClock className="text-xl" />,
    },
    {
      title: "Refund Requests",
      value: formatCompactNumber(8),
      delta: "+1.2%",
      deltaTone: "positive" as const,
      icon: <FiRefreshCcw className="text-xl" />,
    },
  ];

  return (
    <div className="h-screen w-full bg-gray-100 overflow-y-auto">
      <Header
        title="Agent Dashboard"
        Subtitle="Track your daily transactions and revenue"
        actions={
          <select className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium">
            <option>{timeRange}</option>
            <option>Yesterday</option>
            <option>This Week</option>
          </select>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {stats.map((s) => (
            <StatCard
              key={s.title}
              title={s.title}
              value={s.value}
              delta={s.delta}
              deltaTone={s.deltaTone}
              icon={s.icon}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <RecentTransactions />
          <TopAgents />
        </div>

        <RevenueTrend />
      </div>
    </div>
  );
}

export default Page;
