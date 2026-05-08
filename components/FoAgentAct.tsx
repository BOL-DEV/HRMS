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
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel lg:flex-row lg:items-center lg:justify-between">
      <div className="flex w-full items-center gap-3 lg:w-auto">
        <div className="relative w-full lg:w-96">
          <FiSearch className="absolute left-3 top-3 text-gray-400 dark:text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-500 dark:text-slate-400" />
          <select
            value={status}
            onChange={(e) => onStatus(e.target.value as FoAgentStatus | "all")}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={sort}
            onChange={(e) => onSort(e.target.value as SortOption)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="revenue">Revenue</option>
          </select>
        </div>
      </div>

      <button className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-line-subtle dark:bg-panel dark:text-slate-200 dark:hover:bg-panel-strong lg:self-auto">
        <FiDownload />
        Export
      </button>
    </div>
  );
}

export default FoAgentAct;
