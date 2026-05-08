import { FoAgentsSummary } from "@/libs/type";

type Props = {
  summary?: FoAgentsSummary;
  isLoading?: boolean;
};

function AgentStatsCards({ summary, isLoading = false }: Props) {
  const cards = [
    { label: "Total Agents", value: summary?.total_agents ?? 0 },
    { label: "Active Agents", value: summary?.active_agents ?? 0 },
    { label: "Suspended Agents", value: summary?.suspended_agents ?? 0 },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel"
        >
          <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
            {card.label}
          </p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">
            {isLoading ? "--" : card.value}
          </h2>
        </div>
      ))}
    </div>
  );
}

export default AgentStatsCards;
