import React from 'react'
import { formatCurrency } from "@/libs/helper";


const topAgents = [
  { name: "Agent James", amount: 8450 },
  { name: "Agent Lisa", amount: 7200 },
  { name: "Agent Marcus", amount: 6890 },
  { name: "Agent Patricia", amount: 5720 },
  { name: "Agent David", amount: 4560 },
];

function TopAgents( ){

    return (
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold">Top Agents Today</h2>
        </div>

        <div className="p-3">
          {topAgents.map((agent, idx) => (
            <div
              key={agent.name}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <p className="font-semibold text-gray-900">{agent.name}</p>
              </div>

              <p className="font-bold text-blue-700">
                {formatCurrency(agent.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
}

export default TopAgents
