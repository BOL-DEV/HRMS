import React from "react";

interface Props {
  title: string;
  value: string;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  accentClassName?: string;
  iconClassName?: string;
  iconBackgroundClassName?: string;
  valueClassName?: string;
}

function StatCard({
  title,
  value,
  delta,
  deltaTone = "neutral",
  icon,
  accentClassName,
  iconClassName,
  iconBackgroundClassName,
  valueClassName,
}: Props) {
  const deltaClassName =
    deltaTone === "positive"
      ? "text-blue-600"
      : deltaTone === "negative"
        ? "text-red-600"
        : "text-gray-500 dark:text-slate-400";

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 flex items-start justify-between shadow-[0_14px_35px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900 ${accentClassName ?? ""}`}
    >
      <div>
        <p className="text-sm text-gray-600 font-medium dark:text-slate-400">
          {title}
        </p>
        <h2
          className={`mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100 ${valueClassName ?? ""}`}
        >
          {value}
        </h2>
        {delta ? (
          <p className={`text-sm font-medium mt-2 ${deltaClassName}`}>
            {delta}
          </p>
        ) : null}
      </div>

      <div
        className={`rounded-xl p-3 bg-blue-100 text-blue-600 dark:bg-sky-500/15 dark:text-sky-300 ${iconBackgroundClassName ?? ""} ${iconClassName ?? ""}`}
      >
        {icon}
      </div>
    </div>
  );
}

export default StatCard;
