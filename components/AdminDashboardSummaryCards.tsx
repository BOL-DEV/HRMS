import StatCard from "@/components/StatCard";
import { formatCompactNumber, formatNaira } from "@/libs/helper";
import {
  FiActivity,
  FiDollarSign,
  FiFileText,
  FiUsers,
} from "react-icons/fi";
import { LuHospital } from "react-icons/lu";

type Props = {
  isLoading?: boolean;
  summary: {
    totalHospitals: number;
    activeHospitals: number;
    totalRevenue: number;
    totalTransactions: number;
    totalAgents: number;
  };
};

function AdminDashboardSummaryCards({ isLoading = false, summary }: Props) {
  const stats = [
    {
      title: "Total Hospitals",
      value: formatCompactNumber(summary.totalHospitals),
      icon: <LuHospital className="text-xl" />,
    },
    {
      title: "Active Hospitals",
      value: formatCompactNumber(summary.activeHospitals),
      icon: <FiActivity className="text-xl" />,
    },
    {
      title: "Total Platform Revenue",
      value: formatNaira(summary.totalRevenue),
      icon: <FiDollarSign className="text-xl" />,
    },
    {
      title: "Total Transactions",
      value: new Intl.NumberFormat("en-NG").format(summary.totalTransactions),
      icon: <FiFileText className="text-xl" />,
    },
    {
      title: "Total Agents",
      value: formatCompactNumber(summary.totalAgents),
      icon: <FiUsers className="text-xl" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {isLoading
        ? Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            />
          ))
        : stats.map((item) => (
            <StatCard
              key={item.title}
              title={item.title}
              value={item.value}
              icon={item.icon}
            />
          ))}
    </div>
  );
}

export default AdminDashboardSummaryCards;
