import { useMemo } from "react";
import { agents } from "@/libs/data";
function AgentStatsCards() {

      const stats = useMemo(() => {
        const total = agents.length;
        const active = agents.filter((a) => a.status === "Active").length;
        const suspended = agents.filter((a) => a.status === "Suspended").length;
        return { total, active, suspended };
      }, []);

    return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[{ label: "Total Agents", value: stats.total }, { label: "Active Agents", value: stats.active }, { label: "Suspended Agents", value: stats.suspended }].map((card) => (
                    <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-5">
                      <p className="text-sm text-gray-600 font-medium">{card.label}</p>
                      <h2 className="text-3xl font-bold mt-2">{card.value}</h2>
                    </div>
                  ))}
                </div>
    )
}

export default AgentStatsCards
