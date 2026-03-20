import Header from "@/components/Header";
import PaymentMethodBreakdown from "@/components/PaymentMethodBreakdown";
import RecentTransactions from "@/components/RecentTransactions";
import RefundRequests from "@/components/RefundRequests";
import RevenueByDepartment from "@/components/RevenueByDepartment";
import RevenueTrend from "@/components/RevenueTrend";
import AgentPerformance from "@/components/AgentPerformance";
import { FiCalendar } from "react-icons/fi";
import { transactions } from "@/libs/data";
import { formatNaira } from "@/libs/helper";

function getDateKey(dateTime: string) {
  // Expected: YYYY-MM-DD ...
  return dateTime.split(" ")[0] ?? "";
}

function getMonthKey(dateKey: string) {
  // YYYY-MM
  return dateKey.slice(0, 7);
}

function getPrevMonthKey(monthKey: string) {
  // monthKey: YYYY-MM
  const year = Number(monthKey.slice(0, 4));
  const month = Number(monthKey.slice(5, 7));
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    month < 1 ||
    month > 12
  )
    return "";
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
}

function sumAmounts(
  rows: typeof transactions,
  predicate: (row: (typeof transactions)[number]) => boolean,
) {
  return rows.reduce(
    (acc, row) => (predicate(row) ? acc + row.amount : acc),
    0,
  );
}

function buildPeriodStats() {
  const dateKeys = transactions
    .map((t) => getDateKey(t.dateTime))
    .filter(Boolean);
  const latestDateKey = dateKeys.sort().at(-1) ?? "";
  const latestMonthKey = latestDateKey ? getMonthKey(latestDateKey) : "";
  const prevMonthKey = latestMonthKey ? getPrevMonthKey(latestMonthKey) : "";
  const latestYearKey = latestDateKey.slice(0, 4);

  const isRefund = (status: string) => status.startsWith("Refund");

  const forDay = (dateKey: string) => ({
    revenue: sumAmounts(
      transactions,
      (t) => getDateKey(t.dateTime) === dateKey && t.status === "Paid",
    ),
    refund: sumAmounts(
      transactions,
      (t) => getDateKey(t.dateTime) === dateKey && isRefund(t.status),
    ),
  });

  const forMonth = (monthKey: string) => ({
    revenue: sumAmounts(
      transactions,
      (t) =>
        getMonthKey(getDateKey(t.dateTime)) === monthKey && t.status === "Paid",
    ),
    refund: sumAmounts(
      transactions,
      (t) =>
        getMonthKey(getDateKey(t.dateTime)) === monthKey && isRefund(t.status),
    ),
  });

  const forYear = (yearKey: string) => ({
    revenue: sumAmounts(
      transactions,
      (t) => getDateKey(t.dateTime).startsWith(yearKey) && t.status === "Paid",
    ),
    refund: sumAmounts(
      transactions,
      (t) => getDateKey(t.dateTime).startsWith(yearKey) && isRefund(t.status),
    ),
  });

  return {
    today: latestDateKey ? forDay(latestDateKey) : { revenue: 0, refund: 0 },
    thisMonth: latestMonthKey
      ? forMonth(latestMonthKey)
      : { revenue: 0, refund: 0 },
    lastMonth: prevMonthKey
      ? forMonth(prevMonthKey)
      : { revenue: 0, refund: 0 },
    thisYear: latestYearKey
      ? forYear(latestYearKey)
      : { revenue: 0, refund: 0 },
  };
}

const periodStats = buildPeriodStats();

function StatsPeriodCard({
  accentClassName,
  revenueLabel,
  refundLabel,
  revenue,
  refund,
}: {
  accentClassName: string;
  revenueLabel: string;
  refundLabel: string;
  revenue: number;
  refund: number;
}) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-5 flex items-start justify-between border-l-4 ${accentClassName}`}
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-gray-500">
            {revenueLabel}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatNaira(revenue)}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wide text-gray-500">
            {refundLabel}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatNaira(refund)}
          </p>
        </div>
      </div>

      <div className="text-gray-200 mt-2">
        <FiCalendar className="text-4xl" />
      </div>
    </div>
  );
}

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
        <div className="grid grid-cols-1 sm:grid-cols-2  xl:grid-cols-4 gap-4">
          <StatsPeriodCard
            accentClassName="border-red-600"
            revenueLabel="REVENUE (TODAY)"
            refundLabel="REFUND (TODAY)"
            revenue={periodStats.today.revenue}
            refund={periodStats.today.refund}
          />
          <StatsPeriodCard
            accentClassName="border-green-600"
            revenueLabel="REVENUE (THIS MONTH)"
            refundLabel="REFUND (THIS MONTH)"
            revenue={periodStats.thisMonth.revenue}
            refund={periodStats.thisMonth.refund}
          />
          <StatsPeriodCard
            accentClassName="border-pink-900"
            revenueLabel="REVENUE (LAST MONTH)"
            refundLabel="REFUND (LAST MONTH)"
            revenue={periodStats.lastMonth.revenue}
            refund={periodStats.lastMonth.refund}
          />
          <StatsPeriodCard
            accentClassName="border-yellow-600"
            revenueLabel="REVENUE (THIS YEAR)"
            refundLabel="REFUND (THIS YEAR)"
            revenue={periodStats.thisYear.revenue}
            refund={periodStats.thisYear.refund}
          />
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
