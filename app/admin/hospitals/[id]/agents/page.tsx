"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import StatusPill from "@/components/StatusPill";
import { formatNaira, formatUsd } from "@/libs/helper";
import { getHospitalById, type HospitalAgent } from "@/libs/hospital";

export default function HospitalAgentsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const hospital = id ? getHospitalById(id) : undefined;

  const [query, setQuery] = useState("");

  const [agentsState, setAgentsState] = useState<HospitalAgent[]>([]);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);

  const [newAgentForm, setNewAgentForm] = useState({ name: "", email: "", role: "Agent" });
  const [topUpForm, setTopUpForm] = useState({ agentId: "", amount: "" });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const seed = hospital?.agentsList ?? [];
    setAgentsState(seed);
    setTopUpForm({ agentId: seed[0]?.id ?? "", amount: "" });
    setShowAddAgent(false);
    setShowTopUp(false);
    setMessage(null);
    setNewAgentForm({ name: "", email: "", role: "Agent" });
  }, [hospital?.id]);

  const agents = useMemo(() => {
    const seed = agentsState;
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return seed;
    return seed.filter(
      (a) =>
        a.name.toLowerCase().includes(normalizedQuery) ||
        a.email.toLowerCase().includes(normalizedQuery),
    );
  }, [agentsState, query]);

  const handleAddAgent = () => {
    const name = newAgentForm.name.trim();
    const email = newAgentForm.email.trim();
    const role = newAgentForm.role.trim() || "Agent";

    if (!name || !email) {
      setMessage("Enter agent name and email.");
      return;
    }

    const emailTaken = agentsState.some((a) => a.email.toLowerCase() === email.toLowerCase());
    if (emailTaken) {
      setMessage("An agent with this email already exists.");
      return;
    }

    const next: HospitalAgent = {
      id: `agent-${Date.now()}`,
      name,
      email,
      role,
      walletBalance: 0,
      sales: 0,
      performance: 0,
      status: "Active",
    };

    setAgentsState((prev) => [next, ...prev]);
    setNewAgentForm({ name: "", email: "", role: "Agent" });
    setMessage("Agent added (local preview only).");
    setShowAddAgent(false);
  };

  const handleTopUp = () => {
    const amount = Number(topUpForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Enter a valid top up amount.");
      return;
    }

    if (!topUpForm.agentId) {
      setMessage("Select an agent to top up.");
      return;
    }

    setAgentsState((prev) =>
      prev.map((a) =>
        a.id === topUpForm.agentId
          ? { ...a, walletBalance: a.walletBalance + amount }
          : a,
      ),
    );

    const agentName = agentsState.find((a) => a.id === topUpForm.agentId)?.name ?? "Agent";
    setTopUpForm((prev) => ({ ...prev, amount: "" }));
    setMessage(`${formatNaira(amount)} added to ${agentName} balance (local preview only).`);
    setShowTopUp(false);
  };

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agents by name..."
            className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Hospital Agents</h2>
            <p className="text-sm text-gray-600">Manage and monitor agent performance</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowTopUp((v) => !v);
                setShowAddAgent(false);
                setMessage(null);
              }}
              className="bg-white hover:bg-gray-50 text-gray-900 font-medium px-4 py-2 rounded-lg border border-gray-200"
              type="button"
            >
              Top Up Agent
            </button>
            <button
              onClick={() => {
                setShowAddAgent((v) => !v);
                setShowTopUp(false);
                setMessage(null);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
              type="button"
            >
              Add Agent
            </button>
          </div>
        </div>

        {showTopUp ? (
          <div className="p-5 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-sm font-semibold text-gray-800">Agent</label>
                <select
                  value={topUpForm.agentId}
                  onChange={(e) => setTopUpForm((prev) => ({ ...prev, agentId: e.target.value }))}
                  className="mt-2 w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium"
                >
                  {agentsState.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800">Amount</label>
                <input
                  value={topUpForm.amount}
                  onChange={(e) => setTopUpForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="mt-2 w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm"
                  placeholder="0.00"
                  type="number"
                  min={0.01}
                  step={0.01}
                  inputMode="decimal"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTopUp(false)}
                  className="bg-white hover:bg-gray-50 text-gray-900 font-medium px-4 py-2 rounded-lg border border-gray-200"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTopUp}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
                  type="button"
                >
                  Top Up
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showAddAgent ? (
          <div className="p-5 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-sm font-semibold text-gray-800">Name</label>
                <input
                  value={newAgentForm.name}
                  onChange={(e) => setNewAgentForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-2 w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800">Email</label>
                <input
                  value={newAgentForm.email}
                  onChange={(e) => setNewAgentForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-2 w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm"
                  placeholder="name@hospital.com"
                  type="email"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800">Role</label>
                <select
                  value={newAgentForm.role}
                  onChange={(e) => setNewAgentForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="mt-2 w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium"
                >
                  <option value="Agent">Agent</option>
                  <option value="Senior Agent">Senior Agent</option>
                  <option value="Junior Agent">Junior Agent</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddAgent(false)}
                  className="bg-white hover:bg-gray-50 text-gray-900 font-medium px-4 py-2 rounded-lg border border-gray-200"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAgent}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
                  type="button"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {message ? (
          <div className="px-5 pt-5">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              {message}
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr className="border-b border-gray-200">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Balance</th>
                <th className="p-4 font-semibold">Sales</th>
                <th className="p-4 font-semibold">Performance</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.length ? (
                agents.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100 last:border-0">
                    <td className="p-4 font-medium text-gray-900">{a.name}</td>
                    <td className="p-4 text-gray-700">{a.email}</td>
                    <td className="p-4 text-gray-700">{a.role}</td>
                    <td className="p-4 font-medium text-gray-900">{formatNaira(a.walletBalance)}</td>
                    <td className="p-4 font-medium text-gray-900">{formatUsd(a.sales)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${a.performance}%` }}
                          />
                        </div>
                        <span className="font-medium text-gray-900">{a.performance}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusPill status={a.status} />
                    </td>
                    <td className="p-4">
                      <button className="inline-flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium bg-white">
                        Activate
                        <FiChevronDown className="text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    No agents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
