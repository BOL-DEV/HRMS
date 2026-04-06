import AdminSearchField from "@/components/AdminSearchField";
import type { ReactNode } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";

type DepartmentRow = {
  id: string | null;
  name: string;
};

type Props = {
  rows: DepartmentRow[];
  search: string;
  isLoading?: boolean;
  isDeleting?: boolean;
  onSearchChange: (value: string) => void;
  onOpenCreateModal: () => void;
  onRename: (department: DepartmentRow) => void;
  onDelete: (departmentId: string) => void;
  footer?: ReactNode;
};

function AdminHospitalDepartmentsSection({
  rows,
  search,
  isLoading = false,
  isDeleting = false,
  onSearchChange,
  onOpenCreateModal,
  onRename,
  onDelete,
  footer,
}: Props) {
  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-gray-200 p-5 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            Departments
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Create, rename, and remove departments for this hospital
          </p>
        </div>

        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
          <AdminSearchField
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search departments"
          />

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FiPlus />
            Add Department
          </button>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : rows.length ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {rows.map((department) => (
                <div
                  key={department.id ?? department.name}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-gray-900 dark:text-slate-100">
                      {department.name}
                    </p>

                    {department.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onRename(department)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(department.id)}
                          disabled={isDeleting}
                          className="rounded-lg border border-red-200 px-2.5 py-1.5 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                          aria-label={`Delete ${department.name}`}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
              No departments found for this hospital.
            </div>
          )}
        </div>
      </div>

      {footer}
    </>
  );
}

export default AdminHospitalDepartmentsSection;
