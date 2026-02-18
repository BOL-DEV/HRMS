"use client";

import { useState } from 'react'
import { FiDownload,FiPlus } from 'react-icons/fi';
import NewTransactionModal from './NewTransactionModal';

function TransactionActionBar() {
  const [openNewTransaction, setOpenNewTransaction] = useState(false);

  

    return (
      <>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Status</p>
              <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium">
                <option>All</option>
                <option>Paid</option>
                <option>Pending</option>
                <option>Refunded</option>
              </select>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </p>
              <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium">
                <option>All</option>
                <option>Cash</option>
                <option>Transfer</option>
                <option>POS</option>
              </select>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Date Range
              </p>
              <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium">
                <option>Today</option>
                <option>Yesterday</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>

            <div>
              <button
                className="w-full md:w-auto bg-blue-700 hover:bg-blue-800 text-white font-medium px-5 py-3 rounded-xl flex items-center justify-center gap-2"
                onClick={() => setOpenNewTransaction(true)}
              >
                <FiPlus className="text-lg" /> New Transaction
              </button>
            </div>

            <div>
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium px-5 py-3 rounded-xl flex items-center justify-center gap-2 border border-gray-200">
                <FiDownload className="text-lg" /> Export
              </button>
            </div>
          </div>
        </div>

        <NewTransactionModal
          open={openNewTransaction}
          onClose={() => setOpenNewTransaction(false)}
        />
      </>
    );
}

export default TransactionActionBar
