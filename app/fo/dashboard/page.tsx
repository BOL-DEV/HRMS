import Header from "@/components/Header";
import PaymentMethodBreakdown from "@/components/PaymentMethodBreakdown";
import RecentTransactions from "@/components/RecentTransactions";
import RefundRequests from "@/components/RefundRequests";
import RevenueByDepartment from "@/components/RevenueByDepartment";
import RevenueTrend from "@/components/RevenueTrend";
import StatCard from "@/components/StatCard";
import AgentPerformance, {
} from "@/components/AgentPerformance";
import {
  FiClock,
  FiDollarSign,
  FiFileText,
  FiRefreshCcw,
} from "react-icons/fi";

const stats = [
  {
    title: "Total Revenue",
    value: "$125,450",
    delta: "+12.5% vs last week",
    deltaTone: "positive" as const,
    icon: <FiDollarSign className="text-xl" />,
  },
  {
    title: "Total Transactions",
    value: "3,248",
    delta: "+8.2% vs last week",
    deltaTone: "positive" as const,
    icon: <FiFileText className="text-xl" />,
  },
  {
    title: "Pending Payments",
    value: "$34,500",
    delta: "-2.4% vs last week",
    deltaTone: "negative" as const,
    icon: <FiClock className="text-xl" />,
  },
  {
    title: "Refund Requests",
    value: "12",
    delta: "+1.2% vs last week",
    deltaTone: "neutral" as const,
    icon: <FiRefreshCcw className="text-xl" />,
  },
];

function Page() {
  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <Header
        title="Financial Office Dashboard"
        Subtitle="Monitor hospital revenue, agent performance, and transactions"
        actions={
          <select className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium md:block hidden">
            <option>Today</option>
            <option>Yesterday</option>
            <option>This Week</option>
          </select>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((item) => (
            <StatCard
              key={item.title}
              title={item.title}
              value={item.value}
              delta={item.delta}
              deltaTone={item.deltaTone}
              icon={item.icon}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RevenueTrend />
          <RevenueByDepartment />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PaymentMethodBreakdown />
          <RefundRequests />
        </div>

        <AgentPerformance />

        <RecentTransactions />
      </div>
    </div>
  );
}

export default Page;
