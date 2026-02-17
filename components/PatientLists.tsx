"use client";

import  { useState } from "react";
import {
  FiMoreVertical,
  FiEye,
  FiEdit,
  FiFileText,
  FiPlusCircle,
FiSlash,
  FiPlus,
} from "react-icons/fi";
import { PatientRow } from "@/libs/type";
import StatusPill from "@/components/StatusPill";
import { formatCurrency } from "@/libs/helper";
import NewPatientModal from "./NewPatientModal";


function PatientLists() {
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

    const patients: PatientRow[] = [
      {
        id: "p1",
        name: "John Anderson",
        patientId: "PAT-001",
        phone: "555-0101",
        gender: "Male",
        age: 45,
        lastVisit: "2024-02-15",
        transactions: 12,
        totalPaid: 3450,
        status: "Active",
      },
      {
        id: "p2",
        name: "Sarah Mitchell",
        patientId: "PAT-002",
        phone: "555-0103",
        gender: "Female",
        age: 32,
        lastVisit: "2024-02-10",
        transactions: 8,
        totalPaid: 2100,
        status: "Active",
      },
      {
        id: "p3",
        name: "Robert Chen",
        patientId: "PAT-003",
        phone: "555-0105",
        gender: "Male",
        age: 58,
        lastVisit: "2024-02-05",
        transactions: 15,
        totalPaid: 4200,
        status: "Active",
      },
      {
        id: "p4",
        name: "Emma Wilson",
        patientId: "PAT-004",
        phone: "555-0107",
        gender: "Female",
        age: 29,
        lastVisit: "2024-01-28",
        transactions: 5,
        totalPaid: 1050,
        status: "Inactive",
      },
      {
        id: "p5",
        name: "Michael Brown",
        patientId: "PAT-005",
        phone: "555-0109",
        gender: "Male",
        age: 51,
        lastVisit: "2024-02-08",
        transactions: 10,
        totalPaid: 2850,
        status: "Active",
      },
    ];

    return (
        <div className=" bg-white border border-gray-200 rounded-xl overflow-hidden relative">
            
            {showAddPatient && <NewPatientModal setShowAddPatient={setShowAddPatient} />}

        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Patients</h2>
                <button
                            onClick={() => setShowAddPatient(true)}
                            className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-5 py-3 rounded-xl flex items-center gap-2"
                          >
                            <FiPlus className="text-lg" /> Add Patient
                          </button>
        </div>

        <div className="p-5 overflow-x-auto">
          <table className="min-w-195 w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 bg-gray-100">
                <th className="p-3 font-semibold">Patient Name</th>
                <th className="p-3 font-semibold">Patient ID</th>
                <th className="p-3 font-semibold">Phone</th>
                <th className="p-3 font-semibold">Gender</th>
                <th className="p-3 font-semibold">Age</th>
                <th className="p-3 font-semibold">Last Visit</th>
                <th className="p-3 font-semibold">Transactions</th>
                <th className="p-3 font-semibold">Total Paid</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="p-3 font-semibold text-gray-900">{p.name}</td>
                  <td className="p-3 text-gray-700">{p.patientId}</td>
                  <td className="p-3 text-gray-700">{p.phone}</td>
                  <td className="p-3 text-gray-700">{p.gender}</td>
                  <td className="p-3 text-gray-700">{p.age}</td>
                  <td className="p-3 text-gray-700">{p.lastVisit}</td>
                  <td className="p-3 text-gray-900 font-semibold">
                    {p.transactions}
                  </td>
                  <td className="p-3 text-gray-900 font-semibold">
                    {formatCurrency(p.totalPaid)}
                  </td>
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
                        <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          {[
                            {
                              label: "View Profile",
                              icon: <FiEye className="text-gray-600" />, 
                              tone: "text-gray-800",
                              onClick: () => {},
                            },
                            {
                              label: "Edit Patient",
                              icon: <FiEdit className="text-gray-600" />, 
                              tone: "text-gray-800",
                              onClick: () => {},
                            },
                            {
                              label: "View Transactions",
                              icon: <FiFileText className="text-gray-600" />,
                              tone: "text-gray-800",
                              onClick: () => {},
                            },
                            {
                              label: "Create Transaction",
                              icon: <FiPlusCircle className="text-gray-600" />,
                              tone: "text-gray-800",
                              onClick: () => {},
                            },
                            {
                              label: "Deactivate Patient",
                              icon: <FiSlash className="text-red-500" />,
                              tone: "text-red-600",
                              onClick: () => {},
                            },
                          ].map((item, idx) => (
                            <button
                              key={item.label}
                              onClick={() => {
                                item.onClick();
                                setOpenMenu(null);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${item.tone} ${
                                idx === 4
                                  ? "hover:bg-red-50"
                                  : "hover:bg-gray-50"
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

export default PatientLists
