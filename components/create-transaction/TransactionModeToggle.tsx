import type { TransactionMode } from "@/components/create-transaction/types";

type Props = {
  value: TransactionMode;
  showPharmacy?: boolean;
  onChange: (mode: TransactionMode) => void;
};

function TransactionModeToggle({ value, onChange, showPharmacy }: Props) {
  return (
    <div className="inline-flex rounded-2xl border border-gray-200 bg-gray-50 p-1 dark:border-line-subtle dark:bg-panel-strong/60">
      <button
        type="button"
        onClick={() => onChange("patient")}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
          value === "patient"
            ? "bg-brand-700 text-white shadow-sm"
            : "text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-panel"
        }`}
      >
        Patient Payment
      </button>
      <button
        type="button"
        onClick={() => onChange("express")}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
          value === "express"
            ? "bg-brand-700 text-white shadow-sm"
            : "text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-panel"
        }`}
      >
        Express Payment
      </button>
      {showPharmacy && (
        <button
          type="button"
          onClick={() => onChange("pharmacy")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            value === "pharmacy"
              ? "bg-brand-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-panel"
          }`}
        >
          Pharmacy Payment
        </button>
      )}
    </div>
  );
}

export default TransactionModeToggle;
