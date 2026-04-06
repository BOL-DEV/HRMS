import StatCard from "@/components/StatCard";
import { formatCompactNumber, formatNaira } from "@/libs/helper";
import { FiDollarSign, FiSlash } from "react-icons/fi";
import { LuHospital } from "react-icons/lu";

type Props = {
  isLoading?: boolean;
  summary: {
    totalHospitals: number;
    suspendedHospitals: number;
    totalRevenue: number;
  };
};

function AdminHospitalsSummaryCards({
  isLoading = false,
  summary,
}: Props) {
  const stats = [
    {
      title: "Total Hospitals",
      value: formatCompactNumber(summary.totalHospitals),
      icon: <LuHospital className="text-xl" />,
    },
    {
      title: "Suspended Hospitals",
      value: formatCompactNumber(summary.suspendedHospitals),
      icon: <FiSlash className="text-xl" />,
    },
    {
      title: "Total Platform Revenue",
      value: formatNaira(summary.totalRevenue),
      icon: <FiDollarSign className="text-xl" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {isLoading
        ? Array.from({ length: 3 }).map((_, index) => (
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

export default AdminHospitalsSummaryCards;
