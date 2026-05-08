import React from "react";

type DashboardAccent = "admin" | "fo" | "agent" | "neutral";

type Props = {
  title: string;
  subtitle?: string;
  accent?: DashboardAccent;
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
};

const accentStyles: Record<DashboardAccent, string> = {
  admin: "border-t-4 border-t-brand-600",
  fo: "border-t-4 border-t-brand-500",
  agent: "border-t-4 border-t-brand-700",
  neutral: "border-t-4 border-t-slate-200 dark:border-t-slate-700",
};

function DashboardSection({
  title,
  subtitle,
  accent = "neutral",
  actions,
  className,
  contentClassName,
  children,
}: Props) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-line-subtle bg-panel shadow-[0_16px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel ${accentStyles[accent]} ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-line-subtle px-5 py-4 dark:border-line-subtle">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              {subtitle}
            </p>
          ) : null}
        </div>

        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      <div className={contentClassName ?? "p-5"}>{children}</div>
    </section>
  );
}

export default DashboardSection;
