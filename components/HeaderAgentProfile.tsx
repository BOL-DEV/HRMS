"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { FaUser } from "react-icons/fa";
import { FiChevronDown, FiLogOut } from "react-icons/fi";
import { getAgentProfile } from "@/libs/agent-auth";
import { getFoProfile } from "@/libs/fo-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import type { AgentProfileResponse, FoProfileResponse } from "@/libs/type";

type HeaderProfileResponse = AgentProfileResponse | FoProfileResponse;

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
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const hydrated = useHydrated();
  const [openMenu, setOpenMenu] = useState(false);

  const accessToken = useMemo(
    () => (hydrated ? getAccessToken() : null),
    [hydrated],
  );

  const section = pathname.startsWith("/fo")
    ? "fo"
    : pathname.startsWith("/agents")
      ? "agent"
      : "default";

  const profileQuery = useQuery({
    queryKey: [section, "header-profile"],
    queryFn: async (): Promise<HeaderProfileResponse> =>
      section === "fo" ? getFoProfile() : getAgentProfile(),
    enabled: Boolean(accessToken && section !== "default"),
    staleTime: 1000 * 60 * 5,
  });

  const displayName = useMemo(() => {
    const profile = profileQuery.data?.data;
    if (!profile) {
      return null;
    }

    const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
    return fullName || profile.email || "User";
  }, [profileQuery.data]);

  const fallbackLabel =
    section === "fo" ? "Financial Office" : section === "agent" ? "Agent" : "User";

  const handleLogout = async () => {
    clearAuthTokens();
    setOpenMenu(false);
    await queryClient.cancelQueries({ queryKey: ["agent-profile"] });
    await queryClient.cancelQueries({ queryKey: ["fo-dashboard"] });
    queryClient.clear();
    router.replace("/login");
  };

  if (!hydrated || !accessToken) {
    return (
      <div className="flex items-center">
        <h1 className="mr-2 hidden text-sm font-medium text-gray-900 md:block dark:text-slate-200">
          {fallbackLabel}
        </h1>
        <span className="rounded-full bg-blue-200 p-3 dark:bg-sky-500/15">
          <FaUser className="text-lg text-blue-500 dark:text-sky-300" />
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 rounded-xl border border-transparent px-2 py-1 hover:bg-gray-100 dark:hover:bg-slate-800"
        onClick={() => setOpenMenu((current) => !current)}
        type="button"
      >
        <h1 className="hidden text-sm font-medium text-gray-900 md:block dark:text-slate-200">
          {displayName ?? (profileQuery.isLoading ? "Loading..." : fallbackLabel)}
        </h1>
        <span className="rounded-full bg-blue-200 p-3 dark:bg-sky-500/15">
          <FaUser className="text-lg text-blue-500 dark:text-sky-300" />
        </span>
        <FiChevronDown className="hidden text-gray-500 md:block dark:text-slate-400" />
      </button>

      {openMenu ? (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <button
            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={handleLogout}
            type="button"
          >
            <FiLogOut className="text-base" />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
