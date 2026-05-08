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
  variant?: "default" | "compact";
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
  variant = "default",
}: Props) {
  const deltaClassName =
    deltaTone === "positive"
      ? "text-brand-700 dark:text-brand-300"
      : deltaTone === "negative"
        ? "text-red-600"
        : "text-gray-500 dark:text-slate-400";

  return (
    <div
      className={`rounded-2xl border border-line-subtle bg-panel shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:border-line-subtle dark:bg-panel ${variant === "compact" ? "p-4" : "p-5"} flex items-start justify-between ${accentClassName ?? ""}`}
    >
      <div>
        <p className={`${variant === "compact" ? "text-xs" : "text-sm"} text-gray-600 font-semibold tracking-wide dark:text-slate-400`}>
          {title}
        </p>
        <h2
          className={`mt-2 ${variant === "compact" ? "text-2xl" : "text-3xl"} font-black tracking-tight text-gray-900 dark:text-slate-100 ${valueClassName ?? ""}`}
        >
          {value}
        </h2>
        {delta ? (
          <p className={`${variant === "compact" ? "text-xs" : "text-sm"} font-medium mt-2 ${deltaClassName}`}>
            {delta}
          </p>
        ) : null}
      </div>

      <div
        className={`rounded-2xl ${variant === "compact" ? "p-2.5" : "p-3"} bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 ${iconBackgroundClassName ?? ""} ${iconClassName ?? ""}`}
      >
        {icon}
      </div>
    </div>
  );
}

export default StatCard;
