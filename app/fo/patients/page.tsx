"use client";

import Header from "@/components/Header";
import PatientProfileModal, { PatientProfile } from "@/components/PatientProfileModal";
import PatientsTable, { PatientTableRow, PatientStatus } from "@/components/PatientsTable";
import { useMemo, useState } from "react";
import { FiDownload, FiSearch } from "react-icons/fi";

type PatientRecord = PatientTableRow & {
  createdAt: string;
  paymentTrend: { month: string; amount: number }[];
  recentTransactions: { name: string; invoice: string; amount: number; date: string }[];
};

const patients: PatientRecord[] = [
  {
    id: "p1",
    name: "Michael Brown",
    patientId: "PAT-005",
    phone: "+1 (555) 567-8901",
    gender: "Male",
    age: 55,
    totalVisits: 3,
    totalPaid: 900,
    lastVisit: "2024-01-28",
    assignedAgent: "Agent David",
    status: "Inactive",
    pending: 0,
    refunds: 0,
    paymentTrend: [
      { month: "Jan", amount: 300 },
      { month: "Feb", amount: 450 },
      { month: "Mar", amount: 600 },
      { month: "Apr", amount: 750 },
      { month: "May", amount: 900 },
      { month: "Jun", amount: 900 },
    ],
    recentTransactions: [
      { name: "Consultation", invoice: "INV-2024-001", amount: 250, date: "2024-02-15" },
      { name: "Lab Work", invoice: "INV-2024-002", amount: 350, date: "2024-02-10" },
      { name: "Medication", invoice: "INV-2024-003", amount: 300, date: "2024-02-08" },
    ],
    createdAt: "2024-01-10",
  },
  {
    id: "p2",
    name: "Robert Chen",
    patientId: "PAT-003",
    phone: "+1 (555) 345-6789",
    gender: "Male",
    age: 52,
    totalVisits: 5,
    totalPaid: 1650,
    lastVisit: "2024-02-10",
    assignedAgent: "Agent Marcus",
    status: "Active",
    pending: 0,
    refunds: 0,
    paymentTrend: [
      { month: "Jan", amount: 200 },
      { month: "Feb", amount: 250 },
      { month: "Mar", amount: 300 },
      { month: "Apr", amount: 400 },
      { month: "May", amount: 500 },
      { month: "Jun", amount: 0 },
    ],
    recentTransactions: [
      { name: "Follow-up", invoice: "INV-2024-010", amount: 200, date: "2024-02-10" },
      { name: "Lab", invoice: "INV-2024-006", amount: 320, date: "2024-02-05" },
    ],
    createdAt: "2024-01-20",
  },
  {
    id: "p3",
    name: "John Anderson",
    patientId: "PAT-001",
    phone: "+1 (555) 123-4567",
    gender: "Male",
    age: 45,
    totalVisits: 8,
    totalPaid: 2850,
    lastVisit: "2024-02-15",
    assignedAgent: "Agent James",
    status: "Active",
    pending: 0,
    refunds: 0,
    paymentTrend: [
      { month: "Jan", amount: 400 },
      { month: "Feb", amount: 450 },
      { month: "Mar", amount: 500 },
      { month: "Apr", amount: 600 },
      { month: "May", amount: 700 },
      { month: "Jun", amount: 200 },
    ],
    recentTransactions: [
      { name: "Consultation", invoice: "INV-2024-021", amount: 250, date: "2024-02-15" },
      { name: "Imaging", invoice: "INV-2024-017", amount: 500, date: "2024-02-12" },
    ],
    createdAt: "2024-01-05",
  },
  {
    id: "p4",
    name: "Jessica Taylor",
    patientId: "PAT-006",
    phone: "+1 (555) 678-9012",
    gender: "Female",
    age: 35,
    totalVisits: 9,
    totalPaid: 3150,
    lastVisit: "2024-02-12",
    assignedAgent: "Agent James",
    status: "Active",
    pending: 0,
    refunds: 0,
    paymentTrend: [
      { month: "Jan", amount: 300 },
      { month: "Feb", amount: 450 },
      { month: "Mar", amount: 500 },
      { month: "Apr", amount: 600 },
      { month: "May", amount: 700 },
      { month: "Jun", amount: 600 },
    ],
    recentTransactions: [
      { name: "Procedure", invoice: "INV-2024-030", amount: 650, date: "2024-02-12" },
    ],
    createdAt: "2024-02-01",
  },
  {
    id: "p5",
    name: "Sarah Mitchell",
    patientId: "PAT-002",
    phone: "+1 (555) 234-5678",
    gender: "Female",
    age: 38,
    totalVisits: 12,
    totalPaid: 4200,
    lastVisit: "2024-02-14",
    assignedAgent: "Agent Lisa",
    status: "Active",
    pending: 0,
    refunds: 0,
    paymentTrend: [
      { month: "Jan", amount: 500 },
      { month: "Feb", amount: 600 },
      { month: "Mar", amount: 700 },
      { month: "Apr", amount: 800 },
      { month: "May", amount: 900 },
      { month: "Jun", amount: 700 },
    ],
    recentTransactions: [
      { name: "Consultation", invoice: "INV-2024-040", amount: 300, date: "2024-02-14" },
    ],
    createdAt: "2024-01-15",
  },
  {
    id: "p6",
    name: "Emma Wilson",
    patientId: "PAT-004",
    phone: "+1 (555) 456-7890",
    gender: "Female",
    age: 41,
    totalVisits: 15,
    totalPaid: 5100,
    lastVisit: "2024-02-13",
    assignedAgent: "Agent Patricia",
    status: "Active",
    pending: 0,
    refunds: 0,
    paymentTrend: [
      { month: "Jan", amount: 600 },
      { month: "Feb", amount: 700 },
      { month: "Mar", amount: 800 },
      { month: "Apr", amount: 900 },
      { month: "May", amount: 1000 },
      { month: "Jun", amount: 1100 },
    ],
    recentTransactions: [
      { name: "Consultation", invoice: "INV-2024-050", amount: 350, date: "2024-02-13" },
    ],
    createdAt: "2024-01-08",
  },
];

type TimeFilter = "All" | "This Month" | "Last 30 Days";
type SortOption = "newest" | "oldest" | "revenue";

function Page() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PatientStatus | "All">("All");
  const [time, setTime] = useState<TimeFilter>("All");
  const [sort, setSort] = useState<SortOption>("newest");
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);

  const filtered = useMemo(() => {
    const text = search.toLowerCase();

    const bySearch = patients.filter((p) =>
      [p.name, p.patientId, p.phone, p.assignedAgent].some((field) =>
        field.toLowerCase().includes(text)
      )
    );

    const byStatus = status === "All" ? bySearch : bySearch.filter((p) => p.status === status);

    const now = new Date();
    const byTime = byStatus.filter((p) => {
      if (time === "All") return true;
      const visit = new Date(p.lastVisit);
      if (time === "This Month") {
        return visit.getMonth() === now.getMonth() && visit.getFullYear() === now.getFullYear();
      }
      const diff = now.getTime() - visit.getTime();
      return diff <= 30 * 24 * 60 * 60 * 1000;
    });

    const sorted = [...byTime].sort((a, b) => {
      if (sort === "revenue") return b.totalPaid - a.totalPaid;
      const dateA = new Date(a.lastVisit).getTime();
      const dateB = new Date(b.lastVisit).getTime();
      return sort === "newest" ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [search, status, time, sort]);

  const stats = useMemo(() => {
    const total = patients.length;
    const active = patients.filter((p) => p.status === "Active").length;
    const revenue = patients.reduce((sum, p) => sum + p.totalPaid, 0);
    const now = new Date();
    const addedThisMonth = patients.filter((p) => {
      const created = new Date(p.createdAt);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
    return { total, active, revenue, addedThisMonth };
  }, []);

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <Header
        title="Patients Records"
        Subtitle="View all patient records and billing history"
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Patients",
              value: stats.total,
              sub: "",
              icon: "👥",
            },
            {
              label: "Active Patients",
              value: stats.active,
              sub: `${Math.round((stats.active / stats.total) * 100)}% of total`,
              icon: "🩺",
            },
            {
              label: "Total Revenue",
              value: new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
              }).format(stats.revenue),
              sub: `from ${stats.total} patients`,
              icon: "💲",
            },
            {
              label: "Added This Month",
              value: stats.addedThisMonth,
              sub: "",
              icon: "📅",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4"
            >
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-lg">
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  {card.label}
                </p>
                <h2 className="text-2xl font-bold">{card.value}</h2>
                {card.sub ? (
                  <p className="text-xs text-gray-500">{card.sub}</p>
                ) : null}
              </div>
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
                placeholder="Search patients..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as PatientStatus | "All")
                }
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <select
                value={time}
                onChange={(e) => setTime(e.target.value as TimeFilter)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="All">All Time</option>
                <option value="This Month">This Month</option>
                <option value="Last 30 Days">Last 30 Days</option>
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
              <h2 className="text-xl font-bold">Patients List</h2>
              <p className="text-sm text-gray-600">
                {filtered.length} patients found
              </p>
            </div>
          </div>

          <PatientsTable
            rows={filtered}
            onViewProfile={(patient) =>
              setSelectedPatient(patient as PatientProfile)
            }
          />
        </div>
      </div>

      {selectedPatient ? (
        <PatientProfileModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      ) : null}
    </div>
  );
}

export default Page;
