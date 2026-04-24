"use client";

import type { AdminHospitalStatus } from "@/libs/type";
import { FiSearch } from "react-icons/fi";

type Props = {
  search: string;
  hospitalName: string;
  hospitalCode: string;
  status: AdminHospitalStatus | "all";
  sort: "newest" | "oldest";
  onSearchChange: (value: string) => void;
  onHospitalNameChange: (value: string) => void;
  onHospitalCodeChange: (value: string) => void;
  onStatusChange: (value: AdminHospitalStatus | "all") => void;
  onSortChange: (value: "newest" | "oldest") => void;
};

function AdminHospitalsFilters({
  search,
  hospitalName,
  hospitalCode,
  status,
  sort,
  onSearchChange,
  onHospitalNameChange,
  onHospitalCodeChange,
  onStatusChange,
  onSortChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_220px_180px_160px]">
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search hospital name or code"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <input
        value={hospitalName}
        onChange={(event) => onHospitalNameChange(event.target.value)}
        placeholder="Filter by hospital name"
        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />

      <input
        value={hospitalCode}
        onChange={(event) => onHospitalCodeChange(event.target.value)}
        placeholder="Filter by code"
        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />

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
  );
}

export default AdminHospitalsFilters;
