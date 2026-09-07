"use client";

import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { createPharmacyUnit, getPharmacyUnits } from "@/libs/pharmacy-api";
import StatusPill from "@/components/shared/StatusPill";
import { formatDate } from "@/libs/helper";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FiPlus, FiX } from "react-icons/fi";

export default function HospitalPharmacyPointPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = getAccessToken();
  const hospitalId = params?.id ?? "";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");

  const unitsQuery = useQuery({
    queryKey: ["admin-hospital-pharmacy-points", hospitalId],
    queryFn: () => getPharmacyUnits(hospitalId),
    enabled: Boolean(accessToken && hospitalId),
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(unitsQuery.error instanceof ApiError)) {
      return;
    }

    if (unitsQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
      return;
    }

    if (unitsQuery.error.status === 404) {
      router.replace("/admin/hospitals");
    }
  }, [router, unitsQuery.error]);

  const createMutation = useMutation({
    mutationFn: createPharmacyUnit,
    onSuccess: (response) => {
      toast.success(response.message || "Pharmacy point created successfully.");
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-pharmacy-points", hospitalId],
      });
      setIsModalOpen(false);
      setNewUnitName("");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to create pharmacy point.");
    },
  });

  const units = (unitsQuery.data?.data ?? []).filter((unit) => unit.type === "point");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newUnitName.trim()) {
      toast.error("Please enter a point name.");
      return;
    }

    createMutation.mutate({
      name: newUnitName.trim(),
      type: "point",
      hospital_id: hospitalId,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Pharmacy Points</h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Configure branch or outlet pharmacies for dispensing and restock requests
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <FiPlus />
          Add Point
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-line-subtle bg-panel">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-panel-muted text-left text-gray-600 dark:text-slate-300">
                <th className="p-3 font-semibold">Point Name</th>
                <th className="p-3 font-semibold">Type</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Created At</th>
              </tr>
            </thead>
            <tbody>
              {unitsQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index} className="border-b border-line-subtle">
                    <td colSpan={4} className="p-3">
                      <div className="h-10 animate-pulse rounded-lg bg-panel-muted" />
                    </td>
                  </tr>
                ))
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-sm text-gray-500 dark:text-slate-400">
                    No pharmacy points configured for this hospital.
                  </td>
                </tr>
              ) : (
                units.map((unit) => (
                  <tr key={unit.id} className="border-b border-line-subtle text-slate-800 dark:text-slate-200">
                    <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">{unit.name}</td>
                    <td className="p-3 font-medium text-sky-600 dark:text-sky-400">Pharmacy Point</td>
                    <td className="p-3">
                      <StatusPill status={unit.is_active ? "Active" : "Inactive"} />
                    </td>
                    <td className="p-3 text-gray-500 dark:text-slate-400">
                      {formatDate(unit.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-line-subtle bg-panel shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-line-subtle p-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Create Point</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Add a dispensing pharmacy outlet that requests stock from the main store.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-lg text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
                aria-label="Close"
                type="button"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Point Name</span>
                <input
                  type="text"
                  placeholder="e.g. Pharmacy A"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                  required
                />
              </label>

              <div className="flex items-center justify-end gap-3 border-t border-line-subtle pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-line-subtle bg-panel px-4 py-2 text-sm font-medium text-gray-700 hover:bg-panel-muted dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createMutation.isPending ? "Creating..." : "Create Point"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
