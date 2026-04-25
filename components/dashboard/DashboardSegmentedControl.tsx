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
    "data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:shadow-sm",
  fo: "data-[active=true]:bg-emerald-600 data-[active=true]:text-white data-[active=true]:shadow-sm",
  agent:
    "data-[active=true]:bg-amber-500 data-[active=true]:text-slate-950 data-[active=true]:shadow-sm",
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
      className={`inline-flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-slate-700 dark:bg-slate-800/80 ${className ?? ""}`}
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
