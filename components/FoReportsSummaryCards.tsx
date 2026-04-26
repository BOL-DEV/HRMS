import { formatNaira } from "@/libs/helper";

type Props = {
  isLoading?: boolean;
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  labels?: {
    revenue?: string;
    transactions?: string;
    average?: string;
  };
};

function FoReportsSummaryCards({
  isLoading = false,
  totalRevenue,
  totalTransactions,
  averageTransaction,
  labels,
}: Props) {
  const cards = [
    {
      label: labels?.revenue ?? "Total Revenue",
      value: formatNaira(totalRevenue),
    },
    {
      label: labels?.transactions ?? "Total Transactions",
      value: totalTransactions,
    },
    {
      label: labels?.average ?? "Avg Transaction",
      value: formatNaira(Math.round(averageTransaction)),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
            {card.label}
          </p>
          <h2 className="mt-2 text-2xl font-bold dark:text-slate-100">
            {isLoading ? "--" : card.value}
          </h2>
        </div>
      ))}
    </div>
  );
}

export default FoReportsSummaryCards;
