import type { ChangeEventHandler } from "react";
import { FiSearch } from "react-icons/fi";

type Props = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  className?: string;
};

function AdminSearchField({
  value,
  onChange,
  placeholder,
  className = "w-full max-w-md",
}: Props) {
  return (
    <div className={`relative ${className}`}>
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line-subtle bg-canvas-alt py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
      />
    </div>
  );
}

export default AdminSearchField;
