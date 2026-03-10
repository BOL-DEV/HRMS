"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getHospitalById } from "@/libs/hospital";

export default function HospitalDepartmentsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const hospital = id ? getHospitalById(id) : undefined;

  const [departments, setDepartments] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setDepartments(hospital?.departmentsList ?? []);
    setShowAdd(false);
    setName("");
    setMessage(null);
  }, [hospital?.id]);

  const rows = useMemo(() => {
    return [...departments].sort((a, b) => a.localeCompare(b));
  }, [departments]);

  const handleAddDepartment = () => {
    const nextName = name.trim();
    if (!nextName) {
      setMessage("Enter a department name.");
      return;
    }

    const exists = departments.some((d) => d.toLowerCase() === nextName.toLowerCase());
    if (exists) {
      setMessage("This department already exists.");
      return;
    }

    setDepartments((prev) => [...prev, nextName]);
    setName("");
    setShowAdd(false);
    setMessage("Department created (local preview only).");
  };

  if (!hospital) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-bold">Hospital not found</h2>
        <p className="text-sm text-gray-600">Check the hospital id in the URL.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Departments</h2>
            <p className="text-sm text-gray-600">Create and manage departments for this hospital</p>
          </div>

          <button
            onClick={() => {
              setShowAdd((v) => !v);
              setMessage(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
            type="button"
          >
            Add New Department
          </button>
        </div>

        {showAdd ? (
          <div className="p-5 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-800">Department Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm"
                  placeholder="e.g. Cardiology"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowAdd(false);
                    setName("");
                  }}
                  className="bg-white hover:bg-gray-50 text-gray-900 font-medium px-4 py-2 rounded-lg border border-gray-200"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDepartment}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
                  type="button"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {message ? (
          <div className="px-5 pt-5">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              {message}
            </div>
          </div>
        ) : null}

        <div className="p-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 bg-gray-100">
                <th className="p-3 font-semibold">Department</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((d) => (
                  <tr key={d} className="border-b border-gray-100 last:border-0">
                    <td className="p-3 font-semibold text-gray-900 whitespace-nowrap">{d}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-8 text-center text-gray-500">No departments yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
