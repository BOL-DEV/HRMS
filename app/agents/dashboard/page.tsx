import React from "react";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";

import { FiDollarSign, FiFileText, FiRefreshCcw } from "react-icons/fi";
import { formatCurrency, formatCompactNumber } from "@/libs/helper";
import RecentTransactions from "@/components/RecentTransactions";
import RevenueTrend from "@/components/RevenueTrend";
import TopAgents from "@/components/TopAgents";

function Page() {
  const stats = [
    {
      title: "Current Balance",
      value: formatCurrency(5000000),
      delta: "+12.5%",
      deltaTone: "positive" as const,
      icon: <FiDollarSign className="text-xl" />,
    },
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
      title: "Refund Requests",
      value: formatCompactNumber(8),
      delta: "+1.2%",
      deltaTone: "positive" as const,
      icon: <FiRefreshCcw className="text-xl" />,
    },
  ];

  return (
    <div className="h-screen w-full bg-gray-100">
      <Header
        title="Agent Dashboard"
        Subtitle="Track your daily transactions and revenue"
        actions={
          <select className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium md:block hidden">
            <option>Today</option>
            <option>Yesterday</option>
            <option>This Week</option>
          </select>
        }
      />

      <div className="p-6 space-y-6">
        <select className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium md:hidden ">
          <option>Today</option>
          <option>Yesterday</option>
          <option>This Week</option>
        </select>

        {/* <BalanceTopUp /> */}

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
          {/* <RecentTransactions /> */}
          <RevenueTrend />
          <TopAgents />
        </div>
      </div>
    </div>
  );
}

export default Page;
