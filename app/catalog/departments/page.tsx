"use client";

import AdminHospitalDepartmentFormModal from "@/components/admin/AdminHospitalDepartmentFormModal";
import AdminSearchField from "@/components/admin/AdminSearchField";
import Header from "@/components/shared/Header";
import { formatDateTime } from "@/libs/helper";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useCatalogWorkspace } from "@/components/catalog/CatalogWorkspaceProvider";

type DepartmentRow = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function CatalogDepartmentsPage() {
  const { departments, createDepartment, updateDepartment } =
    useCatalogWorkspace();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<DepartmentRow | null>(null);

  const rows = useMemo(
    () =>
      departments.filter((department) =>
        department.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [departments, search],
  );

  return (
    <div className="min-h-screen w-full bg-canvas">
      <Header
        title="Departments"
        Subtitle="Browse and manage catalog departments"
        actions={
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Add Department
          </button>
        }
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Total Departments
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">
              {rows.length}
            </h2>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Search Departments
            </p>
            <div className="mt-3">
              <AdminSearchField
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search departments"
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
          <div className="border-b border-gray-200 p-5 dark:border-line-subtle">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              Department Directory
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Catalog department list.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 dark:bg-panel-strong dark:text-slate-300">
                  <th className="p-3 font-semibold">Department</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Created</th>
                  <th className="p-3 font-semibold">Updated</th>
                  <th className="p-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="p-4 text-gray-500 dark:text-slate-400" colSpan={5}>
                      No departments found for the current search.
                    </td>
                  </tr>
                ) : (
                  rows.map((department) => (
                    <tr
                      key={department.id}
                      className="border-b border-gray-100 dark:border-line-subtle"
                    >
                      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {department.name}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {department.isActive ? "Active" : "Inactive"}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {formatDateTime(department.createdAt)}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {formatDateTime(department.updatedAt)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingDepartment(department)}
                          className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-line-subtle dark:text-slate-200 dark:hover:bg-panel-strong"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isCreateOpen ? (
        <AdminHospitalDepartmentFormModal
          mode="create"
          onClose={() => setIsCreateOpen(false)}
          onSubmit={(name) => {
            if (!name) {
              toast.error("Enter a department name.");
              return;
            }

            createDepartment(name);
            toast.success("Department saved.");
            setIsCreateOpen(false);
          }}
        />
      ) : null}

      {editingDepartment ? (
        <AdminHospitalDepartmentFormModal
          mode="edit"
          initialName={editingDepartment.name}
          onClose={() => setEditingDepartment(null)}
          onSubmit={(name) => {
            if (!name) {
              toast.error("Enter a department name.");
              return;
            }

            updateDepartment(editingDepartment.id, name);
            toast.success("Department updated.");
            setEditingDepartment(null);
          }}
        />
      ) : null}
    </div>
  );
}
