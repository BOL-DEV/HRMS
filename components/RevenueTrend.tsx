import React from 'react'
import RevenueBarChart from './RevenueBarChart';


  const revenueTrend = [
    { day: "Mon", value: 2400 },
    { day: "Tue", value: 2800 },
    { day: "Wed", value: 1800 },
    { day: "Thu", value: 2900 },
    { day: "Fri", value: 3600 },
    { day: "Sat", value: 2100 },
    { day: "Sun", value: 2950 },
  ];

function RevenueTrend() {

    return (
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold">Revenue Trend</h2>
          <p className="text-sm text-gray-600">Daily revenue performance</p>
        </div>

        <div className="p-5">
          <RevenueBarChart data={revenueTrend} />
        </div>
      </div>
    );
}

export default RevenueTrend
