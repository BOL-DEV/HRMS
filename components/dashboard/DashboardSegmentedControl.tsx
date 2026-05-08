"use client";

type Option<T extends string> = {
  label: string;
  value: T;
};

type Props<T extends string> = {
  value: T;
  options: Array<Option<T>>;
  onChange: (value: T) => void;
  accent?: "admin" | "fo" | "agent";
  className?: string;
};

const accentClasses = {
  admin:
    "data-[active=true]:bg-brand-600 data-[active=true]:text-white data-[active=true]:shadow-sm",
  fo: "data-[active=true]:bg-brand-600 data-[active=true]:text-white data-[active=true]:shadow-sm",
  agent:
    "data-[active=true]:bg-brand-700 data-[active=true]:text-white data-[active=true]:shadow-sm",
};

function DashboardSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  accent = "admin",
  className,
}: Props<T>) {
  return (
    <div
      className={`inline-flex flex-wrap gap-1 rounded-xl border border-line-subtle bg-canvas-alt p-1 dark:border-line-subtle dark:bg-panel-muted ${className ?? ""}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          data-active={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-slate-300 dark:hover:text-white ${accentClasses[accent]}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default DashboardSegmentedControl;
