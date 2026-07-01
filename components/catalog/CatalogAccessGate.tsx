"use client";

import { getCatalogDemoSession } from "@/libs/auth";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

function CatalogAccessGate({ children }: Props) {
  const router = useRouter();
  const isDemoSession = getCatalogDemoSession();

  useEffect(() => {
    if (!isDemoSession) {
      router.replace("/login");
    }
  }, [isDemoSession, router]);

  if (!isDemoSession) {
    return null;
  }

  return children;
}

export default CatalogAccessGate;
