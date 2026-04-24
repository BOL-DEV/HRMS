"use client";

import AdminPasswordSettings from "@/components/AdminPasswordSettings";
import Header from "@/components/Header";
import { getAdminDashboard } from "@/libs/admin-auth";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();

  const sessionQuery = useQuery({
    queryKey: ["admin-settings-session-check"],
    queryFn: () => getAdminDashboard(),
    enabled: Boolean(accessToken),
    retry: false,
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(sessionQuery.error instanceof ApiError)) {
      return;
    }

    if (sessionQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [sessionQuery.error, router]);

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950">
      <Header
        title="Admin Settings"
        Subtitle="Manage security actions for your platform admin session"
      />

      <div className="space-y-6 p-6">
        {sessionQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {sessionQuery.error.message}
          </div>
        ) : null}

        <AdminPasswordSettings />
      </div>
    </div>
  );
}
