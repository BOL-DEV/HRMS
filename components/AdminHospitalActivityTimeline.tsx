import { formatDateTime } from "@/libs/helper";
import { formatNaira } from "@/libs/helper";
import type { AdminHospitalActivityLog } from "@/libs/type";
import { FiClock } from "react-icons/fi";

function formatAction(action: string) {
  return action
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function buildReadableDetails(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata).filter(([key, value]) => {
    if (key === "id" || key.endsWith("_id")) {
      return false;
    }

    if (typeof value === "string" && isUuidLike(value)) {
      return false;
    }

    return value !== null && value !== undefined && value !== "";
  });

  return entries
    .map(([key, value]) => {
      if (key === "amount" && typeof value === "number") {
        return {
          label: "Amount",
          value: formatNaira(value),
        };
      }

      return {
        label: formatLabel(key),
        value:
          value !== null && typeof value === "object"
            ? JSON.stringify(value)
            : String(value),
      };
    })
    .filter((item) => item.value.trim().length > 0);
}

function buildSummary(log: AdminHospitalActivityLog) {
  const actionVerb = log.action.split(".").at(1) ?? log.action;
  const targetType = log.target?.type ? formatLabel(log.target.type) : "Item";
  const targetLabel = log.target?.label ?? "Unknown item";
  const verb = actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1);

  return `${verb} ${targetType}: ${targetLabel}`;
}

function buildActorLine(log: AdminHospitalActivityLog) {
  if (!log.actor) {
    return "Unknown actor";
  }

  return `${log.actor.name} (${formatLabel(log.actor.role.toLowerCase())})`;
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
            ? rows.map((log) => {
                const details = buildReadableDetails(log.metadata);

                return (
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
                            {buildSummary(log)}
                          </p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                            {buildActorLine(log)}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-slate-500">
                            {formatAction(log.action)}
                          </p>
                          {details.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {details.map((item) => (
                                <span
                                  key={`${log.log_id}-${item.label}`}
                                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                >
                                  {item.label}: {item.value}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <div className="shrink-0 text-sm text-gray-500 dark:text-slate-400">
                          {formatDateTime(log.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
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
