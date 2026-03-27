import React, { useState } from "react";
import StatusPill from "@/components/StatusPill";
import { FiEye, FiMoreVertical, FiSlash } from "react-icons/fi";
import { AgentProfile } from "@/libs/type";
import { formatDateTime, formatNaira } from "@/libs/helper";

function AgentsTable({ rows, onViewProfile, onRequestSuspension }: AgentProfile) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
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
            {rows.length === 0 ? (
              <tr>
                <td
                  className="p-4 text-gray-500 dark:text-slate-400"
                  colSpan={10}
                >
                  No agents found for the current filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 dark:border-slate-800"
                >
                  <td className="whitespace-nowrap p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {row.name}
                  </td>
                  <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
                    {row.email}
                  </td>
                  <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
                    {row.phone}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {row.transactions}
                  </td>
                  <td className="p-3 font-semibold text-blue-700 dark:text-blue-300">
                    {formatNaira(row.revenue)}
                  </td>
                  <td className="p-3 text-gray-500 dark:text-slate-400">--</td>
                  <td className="p-3 text-gray-500 dark:text-slate-400">--</td>
                  <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
                    {formatDateTime(row.lastActive)}
                  </td>
                  <td className="p-3">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="p-3 text-right">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() =>
                          setOpenMenu((prev) => (prev === row.id ? null : row.id))
                        }
                        className="rounded-lg border border-transparent p-2 hover:border-gray-200 hover:bg-gray-100 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                        aria-haspopup="true"
                        aria-expanded={openMenu === row.id}
                      >
                        <FiMoreVertical className="text-gray-700 dark:text-slate-200" />
                      </button>

                      {openMenu === row.id ? (
                        <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                          {[
                            {
                              label: "View Profile",
                              icon: <FiEye className="text-gray-600 dark:text-slate-300" />,
                              onClick: () => onViewProfile?.(row),
                            },
                            {
                              label:
                                row.status === "Suspended"
                                  ? "Reactivate Agent"
                                  : "Suspend Agent",
                              icon: <FiSlash className="text-gray-600 dark:text-slate-300" />,
                              onClick: () => onRequestSuspension?.(row),
                            },
                          ].map((item) => (
                            <button
                              key={item.label}
                              onClick={() => {
                                item.onClick();
                                setOpenMenu(null);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AgentsTable;
