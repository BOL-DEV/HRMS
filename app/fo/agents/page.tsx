"use client";

import Header from "@/components/Header";
import AgentsTable, { AgentRow, AgentStatus } from "@/components/AgentsTable";
import AgentProfileModal, { AgentProfile } from "@/components/AgentProfileModal";
import React, { useMemo, useState } from "react";
import { FiDownload, FiFilter, FiSearch } from "react-icons/fi";

const agents: AgentRow[] = [
  {
    id: "a1",
    name: "David Martinez",
    email: "david.martinez@hospital.com",
    phone: "+1-555-0105",
    transactions: 289,
    revenue: 41200,
    pending: 10,
    refunds: 4,
    lastActive: "2024-02-15 11:00 AM",
    status: "Active",
  },
  {
    id: "a2",
    name: "Patricia Johnson",
    email: "patricia.johnson@hospital.com",
    phone: "+1-555-0104",
    transactions: 156,
    revenue: 22400,
    pending: 5,
    refunds: 1,
    lastActive: "2024-02-10 02:15 PM",
    status: "Suspended",
  },
  {
    id: "a3",
    name: "Marcus Williams",
    email: "marcus.williams@hospital.com",
    phone: "+1-555-0103",
    transactions: 267,
    revenue: 35600,
    pending: 15,
    refunds: 5,
    lastActive: "2024-02-14 03:20 PM",
    status: "Active",
  },
  {
    id: "a4",
    name: "Lisa Chen",
    email: "lisa.chen@hospital.com",
    phone: "+1-555-0102",
    transactions: 298,
    revenue: 38500,
    pending: 8,
    refunds: 2,
    lastActive: "2024-02-15 09:45 AM",
    status: "Active",
  },
  {
    id: "a5",
    name: "James Anderson",
    email: "james.anderson@hospital.com",
    phone: "+1-555-0101",
    transactions: 342,
    revenue: 45200,
    pending: 12,
    refunds: 3,
    lastActive: "2024-02-15 10:30 AM",
    status: "Active",
  },
];

type SortOption = "newest" | "oldest" | "revenue";

function Page() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AgentStatus | "All">("All");
  const [sort, setSort] = useState<SortOption>("newest");
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);

  const filtered = useMemo(() => {
    const text = search.toLowerCase();
    const bySearch = agents.filter((a) =>
      [a.name, a.email, a.phone].some((field) =>
        field.toLowerCase().includes(text)
      )
    );

    const byStatus = status === "All" ? bySearch : bySearch.filter((a) => a.status === status);

    const sorted = [...byStatus].sort((a, b) => {
      if (sort === "revenue") return b.revenue - a.revenue;
      const dateA = new Date(a.lastActive).getTime();
      const dateB = new Date(b.lastActive).getTime();
      return sort === "newest" ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [search, status, sort]);

  const stats = useMemo(() => {
    const total = agents.length;
    const active = agents.filter((a) => a.status === "Active").length;
    const suspended = agents.filter((a) => a.status === "Suspended").length;
    return { total, active, suspended };
  }, []);

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
    []
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[{ label: "Total Agents", value: stats.total }, { label: "Active Agents", value: stats.active }, { label: "Suspended Agents", value: stats.suspended }].map((card) => (
            <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm text-gray-600 font-medium">{card.label}</p>
              <h2 className="text-3xl font-bold mt-2">{card.value}</h2>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full lg:w-96">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-500" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AgentStatus | "All")}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Inactive">Inactive</option>
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="revenue">Revenue</option>
              </select>
            </div>
          </div>

          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-50 self-start lg:self-auto">
            <FiDownload />
            Export
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Agents</h2>
              <p className="text-sm text-gray-600">{filtered.length} agents found</p>
            </div>
          </div>

          <AgentsTable
            rows={filtered}
            onViewProfile={(agent) => setSelectedAgent(profilesById[agent.id] ?? agent)}
          />
        </div>
      </div>

      {selectedAgent ? (
        <AgentProfileModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      ) : null}
    </div>
  );
}

export default Page;
