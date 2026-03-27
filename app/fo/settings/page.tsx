"use client";

import AppPre from "@/components/AppPre";
import ChangePassword from "@/components/ChangePassword";
import Header from "@/components/Header";
import ProfileInfo from "@/components/ProfileInfo";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { getFoProfile } from "@/libs/fo-auth";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();

  const profileQuery = useQuery({
    queryKey: ["fo-profile"],
    queryFn: getFoProfile,
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(profileQuery.error instanceof ApiError)) {
      return;
    }

    if (profileQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [profileQuery.error, router]);

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-gray-100 dark:bg-slate-950">
      <Header title="Settings" Subtitle="Manage your account and preferences" />

      <div className="space-y-6 p-6">
        {profileQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {profileQuery.error.message}
          </div>
        ) : null}

        {profileQuery.isLoading ? (
          <div className="h-52 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900" />
        ) : profileQuery.data ? (
          <ProfileInfo profile={profileQuery.data.data} />
        ) : null}

        <ChangePassword workspaceLabel="financial office account" />
        <AppPre />
      </div>
    </div>
  );
}

export default Page;
