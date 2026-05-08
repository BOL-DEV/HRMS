import React from "react";

interface Props {
  label: string;
  tone?: "default" | "info";
}

function TagPill({ label, tone = "default" }: Props) {
  const className =
    tone === "info"
      ? "border border-brand-200 bg-brand-100 text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/15 dark:text-brand-300"
      : "bg-white border border-gray-200 text-gray-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

export default TagPill;
