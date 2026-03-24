import React from "react";

interface Props {
  label: string;
  tone?: "default" | "info";
}

function TagPill({ label, tone = "default" }: Props) {
  const className =
    tone === "info"
      ? "bg-blue-100 border border-blue-200 text-blue-700 dark:bg-sky-500/15 dark:border-sky-500/20 dark:text-sky-300"
      : "bg-white border border-gray-200 text-gray-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

export default TagPill;
