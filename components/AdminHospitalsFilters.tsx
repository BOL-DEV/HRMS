"use client";

import type { AdminHospitalStatus } from "@/libs/type";
import { FiSearch } from "react-icons/fi";

type Props = {
  search: string;
  status: AdminHospitalStatus | "all";
  sort: "newest" | "oldest";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: AdminHospitalStatus | "all") => void;
  onSortChange: (value: "newest" | "oldest") => void;
};

function AdminHospitalsFilters({
  search,
  status,
  sort,
  onSearchChange,
  onStatusChange,
  onSortChange,
}: Props) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="relative flex-1">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search hospital name or code"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div className="flex gap-3 md:justify-end">
        <select
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as AdminHospitalStatus | "all")
          }
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          aria-label="Filter hospitals by status"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>

        <select
          value={sort}
          onChange={(event) =>
            onSortChange(event.target.value as "newest" | "oldest")
          }
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          aria-label="Sort hospitals"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>
    </div>
  );
}

export default AdminHospitalsFilters;
