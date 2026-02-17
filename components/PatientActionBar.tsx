import { FiSearch, FiDownload } from "react-icons/fi";



function PatientActionBar() {

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Search</p>
                      <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-3 bg-white">
                        <FiSearch className="text-gray-500" />
                        <input
                          className="w-full outline-none text-sm"
                          placeholder="Name, ID, phone..."
                        />
                      </div>
                    </div>
        
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Status</p>
                      <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium">
                        <option>All</option>
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>
        
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Date Range
                      </p>
                      <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium">
                        <option>All Time</option>
                        <option>Today</option>
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                      </select>
                    </div>
        
                    <div className="flex items-end">
                      <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium px-5 py-3 rounded-xl flex items-center justify-center gap-2 border border-gray-200">
                        <FiDownload className="text-lg" /> Export
                      </button>
                    </div>
                  </div>
                </div>
        
    )
}

export default PatientActionBar
