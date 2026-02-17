import { FiSearch, FiDownload, FiChevronDown } from "react-icons/fi";

function ReceiptActionBar() {

    return (
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <div className="flex-1">
          <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3">
            <FiSearch className="text-gray-500" />
            <input
              className="w-full outline-none text-sm bg-transparent"
              placeholder="Search by patient, invoice, or receipt ID..."
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <select className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium min-w-44">
            <option>All Statuses</option>
            <option>Paid</option>
            <option>Pending</option>
            <option>Refunded</option>
          </select>

          <select className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium min-w-32">
            <option>Today</option>
            <option>Yesterday</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>

          <button className="bg-white border border-gray-200 rounded-xl px-5 py-3 text-sm font-semibold flex items-center justify-center gap-2 min-w-32 hover:bg-gray-50">
            <FiDownload className="text-lg" /> Export
            <FiChevronDown className="text-lg" />
          </button>
        </div>
      </div>
    );
}

export default ReceiptActionBar
