"use client";

import Header from "@/components/Header";
import AgentsTable from "@/components/AgentsTable";
import AgentProfileModal, {
  AgentProfile,
} from "@/components/AgentProfileModal";
import { useMemo, useState } from "react";
import { agents } from "@/libs/data";
import AgentStatsCards from "@/components/AgentStatsCards";
import { SortOption } from "@/libs/type";
import { AgentStatus } from "@/libs/type";
import FoAgentAct from "@/components/FoAgentAct";

function Page() {
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AgentStatus | "All">("All");
  const [sort, setSort] = useState<SortOption>("newest");

  const filtered = useMemo(() => {
    const text = search.toLowerCase();
    const bySearch = agents.filter((a) =>
      [a.name, a.email, a.phone].some((field) =>
        field.toLowerCase().includes(text),
      ),
    );

    const byStatus =
      status === "All" ? bySearch : bySearch.filter((a) => a.status === status);

    const sorted = [...byStatus].sort((a, b) => {
      if (sort === "revenue") return b.revenue - a.revenue;
      const dateA = new Date(a.lastActive).getTime();
      const dateB = new Date(b.lastActive).getTime();
      return sort === "newest" ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [search, status, sort]);

  const profilesById: Record<string, AgentProfile> = useMemo(
    () => ({
      a1: {
        ...agents[0],
        revenueTrend: [
          { month: "Jan", amount: 6500 },
          { month: "Feb", amount: 7200 },
          { month: "Mar", amount: 8000 },
          { month: "Apr", amount: 7600 },
          { month: "May", amount: 8200 },
          { month: "Jun", amount: 7800 },
        ],
        topPatients: [
          { name: "Michael Brown", revenue: 5200 },
          { name: "Sarah Mitchell", revenue: 4600 },
        ],
      },
      a2: {
        ...agents[1],
        revenueTrend: [
          { month: "Jan", amount: 3100 },
          { month: "Feb", amount: 2800 },
          { month: "Mar", amount: 2600 },
          { month: "Apr", amount: 2400 },
          { month: "May", amount: 2300 },
          { month: "Jun", amount: 2100 },
        ],
        topPatients: [{ name: "Emma Wilson", revenue: 1900 }],
      },
      a3: {
        ...agents[2],
        revenueTrend: [
          { month: "Jan", amount: 5400 },
          { month: "Feb", amount: 5600 },
          { month: "Mar", amount: 5800 },
          { month: "Apr", amount: 6100 },
          { month: "May", amount: 6400 },
          { month: "Jun", amount: 6200 },
        ],
        topPatients: [
          { name: "Robert Chen", revenue: 3300 },
          { name: "James Anderson", revenue: 3200 },
        ],
      },
      a4: {
        ...agents[3],
        revenueTrend: [
          { month: "Jan", amount: 6000 },
          { month: "Feb", amount: 6400 },
          { month: "Mar", amount: 6700 },
          { month: "Apr", amount: 6900 },
          { month: "May", amount: 7100 },
          { month: "Jun", amount: 7200 },
        ],
        topPatients: [{ name: "Jessica Taylor", revenue: 3500 }],
      },
      a5: {
        ...agents[4],
        revenueTrend: [
          { month: "Jan", amount: 6800 },
          { month: "Feb", amount: 7100 },
          { month: "Mar", amount: 7400 },
          { month: "Apr", amount: 7700 },
          { month: "May", amount: 8000 },
          { month: "Jun", amount: 7600 },
        ],
        topPatients: [{ name: "John Anderson", revenue: 4100 }],
      },
    }),
    [],
  );

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <Header
        title="Agents"
        Subtitle="Manage agents and monitor performance"
        actions={
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium md:block hidden">
            + Add Agent
          </button>
        }
      />

      <div className="p-6 space-y-6">
        <AgentStatsCards />

        <FoAgentAct
          search={search}
          sort={sort}
          status={status}
          onStatus={setStatus}
          onSearch={setSearch}
          onSort={setSort}
        />

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Agents</h2>
              <p className="text-sm text-gray-600">
                {filtered.length} agents found
              </p>
            </div>
          </div>

          <AgentsTable
            rows={filtered}
            onViewProfile={(agent) =>
              setSelectedAgent(profilesById[agent.id] ?? agent)
            }
          />
        </div>
      </div>

      {selectedAgent ? (
        <AgentProfileModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      ) : null}
    </div>
  );
}

export default Page;
