"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaUser } from "react-icons/fa";
import { getAgentProfile } from "@/libs/agent-auth";
import { getAgentAccessToken } from "@/libs/auth";

function useHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const id = window.setTimeout(onStoreChange, 0);
      return () => window.clearTimeout(id);
    },
    () => true,
    () => false,
  );
}

export default function HeaderAgentProfile() {
  const hydrated = useHydrated();

  const accessToken = useMemo(
    () => (hydrated ? getAgentAccessToken() : null),
    [hydrated],
  );

  const profileQuery = useQuery({
    queryKey: ["agent-profile"],
    queryFn: getAgentProfile,
    enabled: Boolean(accessToken),
    staleTime: 1000 * 60 * 5,
  });

  const displayName = useMemo(() => {
    const profile = profileQuery.data?.data;
    if (!profile) {
      return null;
    }

    const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
    return fullName || profile.email || "Agent";
  }, [profileQuery.data]);

  if (!hydrated || !accessToken) {
    return (
      <div className="flex items-center">
        <h1 className="mr-2 hidden text-sm font-medium text-gray-900 md:block dark:text-slate-200">
          Agent
        </h1>
        <span className="rounded-full bg-blue-200 p-3 dark:bg-sky-500/15">
          <FaUser className="text-lg text-blue-500 dark:text-sky-300" />
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <h1 className="mr-2 hidden text-sm font-medium text-gray-900 md:block dark:text-slate-200">
        {displayName ?? (profileQuery.isLoading ? "Loading..." : "Agent")}
      </h1>
      <span className="rounded-full bg-blue-200 p-3 dark:bg-sky-500/15">
        <FaUser className="text-lg text-blue-500 dark:text-sky-300" />
      </span>
    </div>
  );
}
