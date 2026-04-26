import { formatDateTime } from "@/libs/helper";
import type { AdminHospitalActivityLog } from "@/libs/type";
import { FiClock } from "react-icons/fi";

function formatAction(action: string) {
  return action
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMetadata(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata);

  if (!entries.length) {
    return "No extra metadata";
  }

  return entries
    .map(([key, value]) => {
      const formattedValue =
        value !== null && typeof value === "object"
          ? JSON.stringify(value)
          : String(value);

      return `${key.replaceAll("_", " ")}: ${formattedValue}`;
    })
    .join(" | ");
}

type Props = {
  rows: AdminHospitalActivityLog[];
  isLoading?: boolean;
};

function AdminHospitalActivityTimeline({ rows, isLoading = false }: Props) {
  return (
    <div className="p-5">
      <div className="divide-y divide-blue-100 dark:divide-slate-800">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex gap-4 py-5">
                <div className="h-8 w-8 animate-pulse rounded-full bg-blue-100 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />
                  <div className="h-3 w-72 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />
                  <div className="h-3 w-60 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />
                </div>
              </div>
            ))
          : rows.length
            ? rows.map((log) => (
                <div key={log.log_id} className="flex gap-4 py-5">
                  <div className="pt-1">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
                      <FiClock />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-slate-100">
                          {formatAction(log.action)}
                        </p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                          {log.actor
                            ? `${log.actor.name} | ${log.actor.email} | ${log.actor.role}`
                            : "Unknown actor"}
                        </p>
                        <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
                          Target: {log.target?.type ?? "unknown"} -{" "}
                          {log.target?.label ?? "Unknown"}
                          {log.target?.id ? ` (${log.target.id})` : ""}
                        </p>
                        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                          {formatMetadata(log.metadata)}
                        </p>
                      </div>

                      <div className="shrink-0 text-sm text-gray-500 dark:text-slate-400">
                        {formatDateTime(log.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            : (
                <div className="py-10 text-center text-gray-500 dark:text-slate-400">
                  No activity logs found for the current filters.
                </div>
              )}
      </div>
    </div>
  );
}

export default AdminHospitalActivityTimeline;
