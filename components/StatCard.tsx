import React from "react";

interface Props {
  title: string;
  value: string;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
}

function StatCard({ title, value, delta, deltaTone = "neutral", icon }: Props) {
  const deltaClassName =
    deltaTone === "positive"
      ? "text-blue-600"
      : deltaTone === "negative"
        ? "text-red-600"
        : "text-gray-500 dark:text-slate-400";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start justify-between dark:border-slate-700 dark:bg-slate-900">
      <div>
        <p className="text-sm text-gray-600 font-medium dark:text-slate-400">
          {title}
        </p>
        <h2 className="text-3xl font-bold mt-2 text-gray-900 dark:text-slate-100">
          {value}
        </h2>
        {delta ? (
          <p className={`text-sm font-medium mt-2 ${deltaClassName}`}>
            {delta}
          </p>
        ) : null}
      </div>

      <div className="p-3 bg-blue-100 rounded-xl text-blue-600 dark:bg-sky-500/15 dark:text-sky-300">
        {icon}
      </div>
    </div>
  );
}

export default StatCard;
