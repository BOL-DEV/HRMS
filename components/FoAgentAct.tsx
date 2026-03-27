import { FiDownload, FiFilter, FiSearch } from "react-icons/fi";
import { FoAgentStatus, SortOption } from "@/libs/type";

interface Props {
  search: string;
  onSearch: (value: string) => void;
  status: FoAgentStatus | "all";
  onStatus: (value: FoAgentStatus | "all") => void;
  sort: SortOption;
  onSort: (value: SortOption) => void;
}

function FoAgentAct({ search, onSearch, status, onStatus, sort, onSort }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex w-full items-center gap-3 lg:w-auto">
        <div className="relative w-full lg:w-96">
          <FiSearch className="absolute left-3 top-3 text-gray-400 dark:text-slate-500" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-500 dark:text-slate-400" />
          <select
            value={status}
            onChange={(e) => onStatus(e.target.value as FoAgentStatus | "all")}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={sort}
            onChange={(e) => onSort(e.target.value as SortOption)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="revenue">Revenue</option>
          </select>
        </div>
      </div>

      <button className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 lg:self-auto">
        <FiDownload />
        Export
      </button>
    </div>
  );
}

export default FoAgentAct;
