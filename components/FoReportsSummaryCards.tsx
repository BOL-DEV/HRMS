import { formatNaira } from "@/libs/helper";

type Props = {
  isLoading?: boolean;
  totalRevenue: number;
  totalTransactions: number;
  labels?: {
    revenue?: string;
    transactions?: string;
  };
};

function FoReportsSummaryCards({
  isLoading = false,
  totalRevenue,
  totalTransactions,
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
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
            {card.label}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight dark:text-slate-100">
            {isLoading ? "--" : card.value}
          </h2>
        </div>
      ))}
    </div>
  );
}

export default FoReportsSummaryCards;
