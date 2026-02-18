"use client";

import React, { useMemo, useState } from "react";
import { FiPlusCircle, FiAlertCircle } from "react-icons/fi";
import { formatCurrency } from "@/libs/helper";

type BalanceKey = "initial" | "main";

type BalanceState = Record<BalanceKey, number>;
type InputState = Record<BalanceKey, string>;

function BalanceTopUp() {
  const [balances, setBalances] = useState<BalanceState>({
    initial: 50000,
    main: 125000,
  });
  const [inputs, setInputs] = useState<InputState>({ initial: "", main: "" });
  const [message, setMessage] = useState<string | null>(null);

  const totals = useMemo(() => {
    return [
      { key: "initial" as const, label: "Initial Balance", tone: "text-amber-700", bg: "bg-amber-50" },
      { key: "main" as const, label: "Main Balance", tone: "text-blue-700", bg: "bg-blue-50" },
    ];
  }, []);

  const handleTopUp = (key: BalanceKey) => {
    const amount = Number(inputs[key]);

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Enter a valid amount greater than zero.");
      return;
    }

    setBalances((prev) => ({ ...prev, [key]: prev[key] + amount }));
    setInputs((prev) => ({ ...prev, [key]: "" }));

    const label = key === "initial" ? "Initial Balance" : "Main Balance";
    setMessage(`${formatCurrency(amount)} added to ${label}.`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Wallet Balances</h2>
          <p className="text-sm text-gray-600">Top up initial and main pools without leaving the dashboard.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 rounded-lg px-3 py-2">
          <FiAlertCircle className="text-gray-500" />
          <span>Local preview only; no API calls.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        {totals.map((item) => (
          <div key={item.key} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{item.label}</p>
                <p className="text-2xl font-bold">{formatCurrency(balances[item.key])}</p>
              </div>
              <span className={`${item.bg} ${item.tone} px-3 py-1 rounded-full text-xs font-semibold`}>
                Live
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={inputs[item.key]}
                onChange={(e) => setInputs((prev) => ({ ...prev, [item.key]: e.target.value }))}
                placeholder="Enter amount"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={() => handleTopUp(item.key)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <FiPlusCircle />
                Top Up
              </button>
            </div>
          </div>
        ))}
      </div>

      {message ? (
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {message}
        </div>
      ) : null}
    </div>
  );
}

export default BalanceTopUp;
