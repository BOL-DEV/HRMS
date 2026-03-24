import Header from "@/components/Header";
import PaymentMethodBreakdown from "@/components/PaymentMethodBreakdown";
import RecentTransactions from "@/components/RecentTransactions";
import RevenueByDepartment from "@/components/RevenueByDepartment";
import RevenueTrend from "@/components/RevenueTrend";
import AgentPerformance from "@/components/AgentPerformance";
import { FiCalendar } from "react-icons/fi";
import { agents, transactions } from "@/libs/data";
import { formatCompactNumber, formatNaira } from "@/libs/helper";

function getDateKey(dateTime: string) {
  // Expected: YYYY-MM-DD ...
  return dateTime.split(" ")[0] ?? "";
}

function getMonthKey(dateKey: string) {
  // YYYY-MM
  return dateKey.slice(0, 7);
}

function parseDateKey(dateKey: string) {
  // dateKey: YYYY-MM-DD
  const d = new Date(`${dateKey}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
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

function countRows(
  rows: typeof transactions,
  predicate: (row: (typeof transactions)[number]) => boolean,
) {
  return rows.reduce((acc, row) => (predicate(row) ? acc + 1 : acc), 0);
}

function buildPeriodStats() {
  const dateKeys = transactions
    .map((t) => getDateKey(t.dateTime))
    .filter(Boolean);
  const latestDateKey = dateKeys.sort().at(-1) ?? "";
  const latestMonthKey = latestDateKey ? getMonthKey(latestDateKey) : "";
  const prevMonthKey = latestMonthKey ? getPrevMonthKey(latestMonthKey) : "";
  const latestYearKey = latestDateKey.slice(0, 4);

  const forDay = (dateKey: string) => ({
    revenue: sumAmounts(
      transactions,
      (t) => getDateKey(t.dateTime) === dateKey,
    ),
    transactions: countRows(
      transactions,
      (t) => getDateKey(t.dateTime) === dateKey,
    ),
  });

  const forMonth = (monthKey: string) => ({
    revenue: sumAmounts(
      transactions,
      (t) => getMonthKey(getDateKey(t.dateTime)) === monthKey,
    ),
    transactions: countRows(
      transactions,
      (t) => getMonthKey(getDateKey(t.dateTime)) === monthKey,
    ),
  });

  const forRollingDays = (endDateKey: string, days: number) => {
    const end = parseDateKey(endDateKey);
    if (!end || days <= 0) return { revenue: 0, transactions: 0 };
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (days - 1));

    const within = (dateTime: string) => {
      const key = getDateKey(dateTime);
      const d = parseDateKey(key);
      if (!d) return false;
      return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
    };

    return {
      revenue: sumAmounts(transactions, (t) => within(t.dateTime)),
      transactions: countRows(transactions, (t) => within(t.dateTime)),
    };
  };

  const forYear = (yearKey: string) => ({
    revenue: sumAmounts(transactions, (t) =>
      getDateKey(t.dateTime).startsWith(yearKey),
    ),
    transactions: countRows(transactions, (t) =>
      getDateKey(t.dateTime).startsWith(yearKey),
    ),
  });

  return {
    today: latestDateKey
      ? forDay(latestDateKey)
      : { revenue: 0, transactions: 0 },
    thisWeek: latestDateKey
      ? forRollingDays(latestDateKey, 7)
      : { revenue: 0, transactions: 0 },
    thisMonth: latestMonthKey
      ? forMonth(latestMonthKey)
      : { revenue: 0, transactions: 0 },
    lastMonth: prevMonthKey
      ? forMonth(prevMonthKey)
      : { revenue: 0, transactions: 0 },
    thisYear: latestYearKey
      ? forYear(latestYearKey)
      : { revenue: 0, transactions: 0 },
  };
}

const periodStats = buildPeriodStats();

function StatsPeriodCard({
  accentClassName,
  revenueLabel,
  transCountLabel,
  revenue,
  transCount,
}: {
  accentClassName: string;
  revenueLabel: string;
  transCountLabel: string;
  revenue: number;
  transCount: number;
}) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-5 flex items-start justify-between border-l-4 dark:border-slate-700 dark:bg-slate-900 ${accentClassName}`}
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-gray-500 dark:text-slate-400">
            {revenueLabel}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1 dark:text-slate-100">
            {formatNaira(revenue)}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wide text-gray-500 dark:text-slate-400">
            {transCountLabel}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1 dark:text-slate-100">
            {formatCompactNumber(transCount)}
          </p>
        </div>
      </div>

      <div className="text-gray-200 mt-2 dark:text-slate-700">
        <FiCalendar className="text-4xl" />
      </div>
    </div>
  );
}

function Page() {
  const cashCount = transactions.filter((t) => t.payment === "Cash").length;
  const transferCount = transactions.filter(
    (t) => t.payment === "Transfer",
  ).length;
  const posCount = transactions.filter((t) => t.payment === "POS").length;

  const leaderboard = [...agents]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((a, idx) => ({
      rank: idx + 1,
      name: a.name,
      count: a.transactions,
      amount: a.revenue,
    }));

  return (
    <div className="w-full bg-gray-50 min-h-screen dark:bg-slate-950">
      <Header
        title="Financial Office Dashboard"
        Subtitle="Monitor hospital revenue, agent performance, and transactions"
        actions={
          <select className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium md:block hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <option>Today</option>
            <option>Yesterday</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>This Year</option>
          </select>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2  xl:grid-cols-4 gap-4">
          <StatsPeriodCard
            accentClassName="border-red-600"
            revenueLabel="REVENUE (TODAY)"
            transCountLabel="TRANSACTIONS (TODAY)"
            revenue={periodStats.today.revenue}
            transCount={periodStats.today.transactions}
          />
          <StatsPeriodCard
            accentClassName="border-green-600"
            revenueLabel="REVENUE (THIS WEEK)"
            transCountLabel="TRANSACTIONS (THIS WEEK)"
            revenue={periodStats.thisWeek.revenue}
            transCount={periodStats.thisWeek.transactions}
          />
          <StatsPeriodCard
            accentClassName="border-pink-900"
            revenueLabel="REVENUE (THIS MONTH)"
            transCountLabel="TRANSACTIONS (THIS MONTH)"
            revenue={periodStats.thisMonth.revenue}
            transCount={periodStats.thisMonth.transactions}
          />
          <StatsPeriodCard
            accentClassName="border-yellow-600"
            revenueLabel="REVENUE (THIS YEAR)"
            transCountLabel="TRANSACTIONS (THIS YEAR)"
            revenue={periodStats.thisYear.revenue}
            transCount={periodStats.thisYear.transactions}
          />
        </div>

        <div className="flex flex-col mb-10 gap-6">
          <RevenueTrend />
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <RevenueByDepartment />

            <div className="bg-white border border-gray-200 rounded-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="p-5 flex items-start justify-between border-b border-gray-200 dark:border-slate-700">
                <div>
                  <h2 className="text-xl font-bold">Agents Leader Board</h2>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Top agents by revenue
                  </p>
                </div>
                <FiCalendar className="text-2xl text-gray-300 dark:text-slate-600" />
              </div>

              <div className="p-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 bg-gray-100 dark:bg-slate-800 dark:text-slate-300">
                      <th className="p-3 font-semibold">#</th>
                      <th className="p-3 font-semibold">Name</th>
                      <th className="p-3 font-semibold text-right">Count</th>
                      <th className="p-3 font-semibold text-right">Amount ₦</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((row) => (
                      <tr
                        key={row.rank}
                        className="border-b border-gray-100 dark:border-slate-800"
                      >
                        <td className="p-3 text-gray-700 dark:text-slate-300">
                          {row.rank}
                        </td>
                        <td className="p-3 font-semibold text-blue-600 whitespace-nowrap">
                          {row.name}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-slate-300 text-right whitespace-nowrap">
                          {formatCompactNumber(row.count)}
                        </td>
                        <td className="p-3 font-semibold text-gray-900 dark:text-slate-100 text-right whitespace-nowrap">
                          {formatNaira(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PaymentMethodBreakdown />
          <div className="bg-white border border-gray-200 rounded-xl p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-gray-200 pb-4 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold">Transaction Counts</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Summary by payment method
                </p>
              </div>
              <FiCalendar className="text-2xl text-gray-300 dark:text-slate-600" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-xl p-4 dark:border-slate-700">
                <p className="text-xs font-semibold tracking-wide text-gray-500 dark:text-slate-400">
                  TOTAL
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1 dark:text-slate-100">
                  {formatCompactNumber(transactions.length)}
                </p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 dark:border-slate-700">
                <p className="text-xs font-semibold tracking-wide text-gray-500 dark:text-slate-400">
                  CASH
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1 dark:text-slate-100">
                  {formatCompactNumber(cashCount)}
                </p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 dark:border-slate-700">
                <p className="text-xs font-semibold tracking-wide text-gray-500 dark:text-slate-400">
                  TRANSFER
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1 dark:text-slate-100">
                  {formatCompactNumber(transferCount)}
                </p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 dark:border-slate-700">
                <p className="text-xs font-semibold tracking-wide text-gray-500 dark:text-slate-400">
                  POS
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1 dark:text-slate-100">
                  {formatCompactNumber(posCount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <AgentPerformance />

        <RecentTransactions />
      </div>
    </div>
  );
}

export default Page;
