import React, { useState } from "react";
import StatusPill from "@/components/StatusPill";
import { FiEye, FiMoreVertical } from "react-icons/fi";
import { AgentProfile } from "@/libs/type";
import { formatUsd } from "@/libs/helper";







function AgentsTable({ rows, onViewProfile }: AgentProfile) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 bg-gray-100">
              <th className="p-3 font-semibold">Name</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Phone</th>
              <th className="p-3 font-semibold">Transactions</th>
              <th className="p-3 font-semibold">Revenue</th>
              <th className="p-3 font-semibold">Pending</th>
              <th className="p-3 font-semibold">Refunds</th>
              <th className="p-3 font-semibold">Last Active</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100">
                <td className="p-3 font-semibold text-gray-900 whitespace-nowrap">{row.name}</td>
                <td className="p-3 text-gray-700 whitespace-nowrap">{row.email}</td>
                <td className="p-3 text-gray-700 whitespace-nowrap">{row.phone}</td>
                <td className="p-3 text-gray-700">{row.transactions}</td>
                <td className="p-3 text-blue-700 font-semibold">{formatUsd(row.revenue)}</td>
                <td className="p-3 text-gray-700">{row.pending}</td>
                <td className="p-3 text-gray-700">{row.refunds}</td>
                <td className="p-3 text-gray-700 whitespace-nowrap">{row.lastActive}</td>
                <td className="p-3">
                  <StatusPill status={row.status} />
                </td>
                <td className="p-3 text-right">
                  <div className="relative inline-block text-left">
                    <button
                      onClick={() =>
                        setOpenMenu((prev) => (prev === row.id ? null : row.id))
                      }
                      className="p-2 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200"
                      aria-haspopup="true"
                      aria-expanded={openMenu === row.id}
                    >
                      <FiMoreVertical className="text-gray-700" />
                    </button>

                    {openMenu === row.id ? (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        {[{
                          label: "View Profile",
                          icon: <FiEye className="text-gray-600" />,
                          onClick: () => onViewProfile?.(row),
                        }].map((item) => (
                          <button
                            key={item.label}
                            onClick={() => {
                              item.onClick();
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
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

// export interface { AgentRow, AgentStatus };
export default AgentsTable;
