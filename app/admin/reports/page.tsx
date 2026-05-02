"use client";

import { getAccessToken } from "@/libs/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();

  useEffect(() => {
    router.replace(accessToken ? "/admin/reports/revenue" : "/login");
  }, [accessToken, router]);

  return null;
}
