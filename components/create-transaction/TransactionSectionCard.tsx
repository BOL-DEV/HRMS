import type { ReactNode } from "react";
import { FiCheckCircle } from "react-icons/fi";

type Props = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  ready?: boolean;
  children: ReactNode;
  className?: string;
};

function TransactionSectionCard({
  title,
  eyebrow,
  subtitle,
  ready = false,
  children,
  className = "",
}: Props) {
  return (
    <section className={`rounded-2xl border border-gray-200 p-5 dark:border-line-subtle dark:bg-panel-muted/35 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
              {eyebrow}
            </p>
          ) : null}
          <h3 className={`mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100 ${eyebrow ? "" : "mt-0"}`}>
            {title}
          </h3>
        </div>

        {ready ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            <FiCheckCircle />
            Ready
          </span>
        ) : null}
      </div>

      {subtitle ? (
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">{subtitle}</p>
      ) : null}

      <div className="mt-4">{children}</div>
    </section>
  );
}

export default TransactionSectionCard;
