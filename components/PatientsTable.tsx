"use client";

import React, { useState } from "react";
import StatusPill from "@/components/StatusPill";
import {
  FiEye,
  FiFileText,
  FiMoreVertical,
  FiPrinter,
  FiSlash,
} from "react-icons/fi";

export type PatientStatus = "Active" | "Inactive";

export type PatientTableRow = {
  id: string;
  name: string;
  patientId: string;
  phone: string;
  gender: "Male" | "Female";
  age: number;
  totalVisits: number;
  totalPaid: number;
  lastVisit: string;
  assignedAgent: string;
  status: PatientStatus;
};

type Props = {
  rows: PatientTableRow[];
  onViewProfile?: (row: PatientTableRow) => void;
};

const usd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);

function PatientsTable({ rows, onViewProfile }: Props) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 bg-gray-100">
              <th className="p-3 font-semibold">Patient Name</th>
              <th className="p-3 font-semibold">Patient ID</th>
              <th className="p-3 font-semibold">Phone</th>
              <th className="p-3 font-semibold">Gender</th>
              <th className="p-3 font-semibold">Age</th>
              <th className="p-3 font-semibold">Total Visits</th>
              <th className="p-3 font-semibold">Total Paid</th>
              <th className="p-3 font-semibold">Last Visit</th>
              <th className="p-3 font-semibold">Assigned Agent</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-gray-100">
                <td className="p-3 font-semibold text-gray-900 whitespace-nowrap">{p.name}</td>
                <td className="p-3 text-gray-700 whitespace-nowrap">{p.patientId}</td>
                <td className="p-3 text-gray-700 whitespace-nowrap">{p.phone}</td>
                <td className="p-3 text-gray-700">{p.gender}</td>
                <td className="p-3 text-gray-700">{p.age}</td>
                <td className="p-3 text-gray-700">{p.totalVisits}</td>
                <td className="p-3 text-blue-700 font-semibold">{usd(p.totalPaid)}</td>
                <td className="p-3 text-gray-700 whitespace-nowrap">{p.lastVisit}</td>
                <td className="p-3 text-gray-700 whitespace-nowrap">{p.assignedAgent}</td>
                <td className="p-3">
                  <StatusPill status={p.status} />
                </td>
                <td className="p-3 text-right">
                  <div className="relative inline-block text-left">
                    <button
                      onClick={() =>
                        setOpenMenu((prev) => (prev === p.id ? null : p.id))
                      }
                      className="p-2 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200"
                      aria-haspopup="true"
                      aria-expanded={openMenu === p.id}
                    >
                      <FiMoreVertical className="text-gray-700" />
                    </button>

                    {openMenu === p.id ? (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        {[{
                          label: "View Profile",
                          icon: <FiEye className="text-gray-600" />,
                          onClick: () => onViewProfile?.(p),
                        },
                        {
                          label: "View Transactions",
                          icon: <FiFileText className="text-gray-600" />,
                          onClick: () => {},
                        },
                        {
                          label: "Print Summary",
                          icon: <FiPrinter className="text-gray-600" />,
                          onClick: () => {},
                        },
                        {
                          label: "Deactivate Patient",
                          icon: <FiSlash className="text-red-500" />,
                          onClick: () => {},
                          danger: true,
                        }].map((item) => (
                          <button
                            key={item.label}
                            onClick={() => {
                              item.onClick();
                              setOpenMenu(null);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${
                              item.danger ? "text-red-600 hover:bg-red-50" : "text-gray-800 hover:bg-gray-50"
                            }`}
                            aria-label={item.label}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PatientsTable;
