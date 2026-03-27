import type { FoReceiptSummary } from "@/libs/type";

type Props = {
  summary?: FoReceiptSummary;
  isLoading?: boolean;
};

function FoReceiptsSummaryCards({ summary, isLoading = false }: Props) {
  const metrics = [
    {
      label: "Total Receipt Requests",
      value: String(summary?.total_receipt_count ?? 0),
    },
    {
      label: "Pending Requests",
      value: String(summary?.pending_request ?? 0),
      tone: "text-amber-600 dark:text-amber-300",
    },
    {
      label: "Approved",
      value: String(summary?.approved ?? 0),
      tone: "text-green-600 dark:text-green-300",
    },
    {
      label: "Rejected",
      value: String(summary?.rejected ?? 0),
      tone: "text-red-600 dark:text-red-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {metric.label}
          </p>
          <span
            className={`text-3xl font-bold ${
              metric.tone ?? "text-slate-900 dark:text-slate-100"
            }`}
          >
            {isLoading ? "--" : metric.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default FoReceiptsSummaryCards;
