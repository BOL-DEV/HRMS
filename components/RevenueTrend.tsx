import React from 'react'
import RevenueBarChart from './RevenueBarChart';


  const revenueTrend = [
    { name: "Mon", value: 2400 },
    { name: "Tue", value: 2800 },
    { name: "Wed", value: 1800 },
    { name: "Thu", value: 2900 },
    { name: "Fri", value: 3600 },
    { name: "Sat", value: 2100 },
    { name: "Sun", value: 2950 },
  ];

  function RevenueTrend() {
    // const data = revenueTrend.map((item) => ({
    //   name: item.name,
    //   value: item.value,
    // }));
    return (
      <RevenueBarChart
        title="Revenue Trend"
        subtitle="Daily revenue performance"
        data={revenueTrend}
      />
    );
  }

export default RevenueTrend
