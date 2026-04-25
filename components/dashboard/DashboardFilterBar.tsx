import React from "react";

type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  accent?: "admin" | "fo" | "agent";
  actions?: React.ReactNode;
  className?: string;
};

const accentTone = {
  admin:
    "from-blue-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40",
  fo: "from-emerald-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40",
  agent:
    "from-amber-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/40",
};

function DashboardFilterBar({
  eyebrow,
  title,
  description,
  accent = "admin",
  actions,
  className,
}: Props) {
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-gradient-to-r px-5 py-5 shadow-[0_16px_45px_rgba(15,23,42,0.04)] dark:border-slate-700 ${accentTone[accent]} ${className ?? ""}`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
            {description}
          </p>
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

export default DashboardFilterBar;
