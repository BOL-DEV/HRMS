"use client";

import StatusPill from "@/components/StatusPill";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export type PatientPaymentPoint = { month: string; amount: number };
export type PatientRecentTx = { name: string; invoice: string; amount: number; date: string };

export type PatientProfile = {
  id: string;
  name: string;
  patientId: string;
  phone: string;
  gender: "Male" | "Female";
  age: number;
  status: "Active" | "Inactive";
  totalPaid: number;
  totalVisits: number;
  lastVisit: string;
  assignedAgent: string;
  paymentTrend?: PatientPaymentPoint[];
  recentTransactions?: PatientRecentTx[];
};

const usd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);

function PatientProfileModal({ patient, onClose }: { patient: PatientProfile; onClose: () => void }) {
  const trend = patient.paymentTrend ?? [];
  const txs = patient.recentTransactions ?? [];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-end">
      <div className="bg-white w-full max-w-4xl h-full overflow-y-auto shadow-2xl">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Patient Profile</h2>
            <p className="text-sm text-gray-600">View patient details and transaction history</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-lg"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-gray-200 rounded-xl p-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-base font-semibold text-gray-900">{patient.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Patient ID</p>
              <p className="text-base font-semibold text-gray-900">{patient.patientId}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-base font-semibold text-gray-900">{patient.phone}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Gender</p>
              <p className="text-base font-semibold text-gray-900">{patient.gender}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Age</p>
              <p className="text-base font-semibold text-gray-900">{patient.age}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Status</p>
              <StatusPill status={patient.status} />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Assigned Agent</p>
              <p className="text-base font-semibold text-gray-900">{patient.assignedAgent}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Last Visit</p>
              <p className="text-base font-semibold text-gray-900">{patient.lastVisit}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[{ label: "Total Amount Paid", value: usd(patient.totalPaid) }, { label: "Total Visits", value: patient.totalVisits }, { label: "Last Visit", value: patient.lastVisit }].map((card) => (
              <div key={card.label} className="border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
            ))}
          </div>

          {trend.length ? (
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold">Monthly Payment Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => usd(Number(v)).replace("$", "")} width={60} />
                    <Line type="monotone" dataKey="amount" stroke="#111827" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}

          {txs.length ? (
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-3">Recent Transactions</h3>
              <div className="divide-y divide-gray-100">
                {txs.map((t) => (
                  <div key={t.invoice} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{t.name}</p>
                      <p className="text-sm text-gray-500">{t.invoice} • {t.date}</p>
                    </div>
                    <p className="font-semibold text-blue-700">{usd(t.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default PatientProfileModal;
