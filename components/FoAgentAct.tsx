import { useState } from "react";
import { AgentStatus } from "@/libs/type";
import { FiDownload, FiFilter, FiSearch } from "react-icons/fi";
import { SortOption } from '@/libs/type';

interface Props {
  search: string;
  onSearch: (value: string) => void;
  status: AgentStatus | "All";
  onStatus: (value: AgentStatus | "All") => void;
  sort: SortOption;
  onSort: (value: SortOption) => void;
}


function FoAgentAct({ search, onSearch, status, onStatus, sort, onSort }: Props) {

     

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full lg:w-96">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-500" />
            <select
              value={status}
              onChange={(e) => onStatus(e.target.value as AgentStatus | "All")}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Inactive">Inactive</option>
            </select>

            <select
              value={sort}
              onChange={(e) => onSort(e.target.value as SortOption)}
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
    );
}

export default FoAgentAct
