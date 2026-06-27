"use client";

import AdminHospitalIncomeHeadFormModal from "@/components/AdminHospitalIncomeHeadFormModal";
import AdminSearchField from "@/components/AdminSearchField";
import Header from "@/components/Header";
import { useCatalogWorkspace } from "@/components/catalog/CatalogWorkspaceProvider";
import { formatDateTime } from "@/libs/helper";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";

export default function CatalogIncomeHeadsPage() {
  const { departments, incomeHeads, createIncomeHead, updateIncomeHead } =
    useCatalogWorkspace();
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingIncomeHead, setEditingIncomeHead] = useState<{
    id: string;
    departmentId: string;
    name: string;
    status: "active" | "suspended";
  } | null>(null);

  const departmentOptions = useMemo(
    () => departments.map((item) => ({ id: item.id, name: item.name })),
    [departments],
  );

  const rows = useMemo(
    () =>
      incomeHeads.filter((item) => {
        const matchesDepartment =
          departmentId === "All" ? true : item.departmentId === departmentId;
        const matchesSearch = item.name
          .toLowerCase()
          .includes(search.trim().toLowerCase());
        return matchesDepartment && matchesSearch;
      }),
    [departmentId, incomeHeads, search],
  );

  return (
    <div className="min-h-screen w-full bg-canvas">
      <Header
        title="Income Heads"
        Subtitle="Browse and manage catalog income heads"
        actions={
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Add Income Head
          </button>
        }
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Search Income Heads
            </p>
            <div className="mt-3">
              <AdminSearchField
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search income heads"
                className="w-full"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Department Filter
            </p>
            <select
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
            >
              <option value="All">All Departments</option>
              {departmentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Total Income Heads
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">
              {rows.length}
            </h2>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
          <div className="border-b border-gray-200 p-5 dark:border-line-subtle">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              Income Head Directory
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Catalog income head list.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 dark:bg-panel-strong dark:text-slate-300">
                  <th className="p-3 font-semibold">Income Head</th>
                  <th className="p-3 font-semibold">Department</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Updated</th>
                  <th className="p-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="p-4 text-gray-500 dark:text-slate-400" colSpan={5}>
                      No income heads found for the current filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 dark:border-line-subtle"
                    >
                      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {item.name}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {item.departmentName}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {item.isActive ? "Active" : "Suspended"}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {formatDateTime(item.updatedAt)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingIncomeHead({
                              id: item.id,
                              departmentId: item.departmentId,
                              name: item.name,
                              status: item.isActive ? "active" : "suspended",
                            })
                          }
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
        <AdminHospitalIncomeHeadFormModal
          mode="create"
          departmentOptions={departmentOptions}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={(values) => {
            if (!values.departmentId || !values.name) {
              toast.error("Select a department and enter a name.");
              return;
            }

            createIncomeHead({
              departmentId: values.departmentId,
              name: values.name,
              status: values.status,
            });
            toast.success("Income head saved.");
            setIsCreateOpen(false);
          }}
        />
      ) : null}

      {editingIncomeHead ? (
        <AdminHospitalIncomeHeadFormModal
          mode="edit"
          departmentOptions={departmentOptions}
          initialValues={{
            departmentId: editingIncomeHead.departmentId,
            name: editingIncomeHead.name,
            status: editingIncomeHead.status,
          }}
          onClose={() => setEditingIncomeHead(null)}
          onSubmit={(values) => {
            if (!values.departmentId || !values.name) {
              toast.error("Select a department and enter a name.");
              return;
            }

            updateIncomeHead(editingIncomeHead.id, {
              departmentId: values.departmentId,
              name: values.name,
              status: values.status,
            });
            toast.success("Income head updated.");
            setEditingIncomeHead(null);
          }}
        />
      ) : null}
    </div>
  );
}
