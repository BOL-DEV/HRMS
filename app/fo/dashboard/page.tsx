import Header from "@/components/Header";
import PaymentMethodBreakdown from "@/components/PaymentMethodBreakdown";
import RecentTransactions from "@/components/RecentTransactions";
import RefundRequests, { RefundRequest } from "@/components/RefundRequests";
import RevenueByDepartment from "@/components/RevenueByDepartment";
import RevenueTrend from "@/components/RevenueTrend";
import StatCard from "@/components/StatCard";
import AgentPerformance, {
  AgentPerformanceRow,
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

const paymentMethods = [
  { name: "Credit Card", value: 45, color: "#2563EB" },
  { name: "Insurance", value: 28, color: "#10B981" },
  { name: "Bank Transfer", value: 18, color: "#F59E0B" },
  { name: "Cash", value: 9, color: "#EF4444" },
];

const refundRequests: RefundRequest[] = [
  {
    id: "r1",
    patient: "Emma Wilson",
    agent: "Patricia",
    reason: "Duplicate charge",
    amount: 150,
    status: "Pending",
  },
  {
    id: "r2",
    patient: "Thomas Gray",
    agent: "Marcus",
    reason: "Service not rendered",
    amount: 200,
    status: "Pending",
  },
  {
    id: "r3",
    patient: "Jessica Lee",
    agent: "James",
    reason: "Quality issue",
    amount: 300,
    status: "Pending",
  },
];

const agentPerformance: AgentPerformanceRow[] = [
  {
    id: "a1",
    name: "Agent James",
    totalTransactions: 156,
    totalRevenue: 28450,
    pending: 8,
    refunds: 2,
    lastActive: "2024-02-15 02:30 PM",
    status: "Active",
  },
  {
    id: "a2",
    name: "Agent Lisa",
    totalTransactions: 142,
    totalRevenue: 25800,
    pending: 5,
    refunds: 1,
    lastActive: "2024-02-15 01:15 PM",
    status: "Active",
  },
  {
    id: "a3",
    name: "Agent Marcus",
    totalTransactions: 138,
    totalRevenue: 24600,
    pending: 12,
    refunds: 3,
    lastActive: "2024-02-14 11:20 AM",
    status: "Active",
  },
  {
    id: "a4",
    name: "Agent Patricia",
    totalTransactions: 125,
    totalRevenue: 22350,
    pending: 3,
    refunds: 0,
    lastActive: "2024-02-15 03:45 PM",
    status: "Active",
  },
  {
    id: "a5",
    name: "Agent David",
    totalTransactions: 98,
    totalRevenue: 17800,
    pending: 6,
    refunds: 2,
    lastActive: "2024-02-13 09:30 AM",
    status: "Inactive",
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
          <PaymentMethodBreakdown data={paymentMethods} />
          <RefundRequests requests={refundRequests} />
        </div>

        <AgentPerformance rows={agentPerformance} />

        <RecentTransactions />
      </div>
    </div>
  );
}

export default Page;
