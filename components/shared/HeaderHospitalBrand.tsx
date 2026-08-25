"use client";

import { useMemo, useSyncExternalStore, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { FiActivity } from "react-icons/fi";
import { getAgentHospitalImageUrl, getAgentProfile } from "@/libs/agent-auth";
import { getPharmacyProfile } from "@/libs/pharmacy-api";
import { getAccessToken, decodeJwt } from "@/libs/auth";
import { getFoHospitalImageUrl, getFoProfile } from "@/libs/fo-auth";
import { PLATFORM_LOGO_SRC } from "@/libs/brand";

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

export default function HeaderHospitalBrand() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const accessToken = useMemo(
    () => (hydrated ? getAccessToken() : null),
    [hydrated],
  );

  const section = pathname.startsWith("/fo")
    ? "fo"
    : pathname.startsWith("/admin")
      ? "admin"
    : pathname.startsWith("/agents")
      ? "agent"
    : pathname.startsWith("/pharmacy")
      ? "pharmacy"
      : "default";

  const profileQuery = useQuery({
    queryKey: [section, "header-profile"],
    queryFn: async () => {
      if (section === "pharmacy") {
        try {
          return await getPharmacyProfile();
        } catch (err) {
          console.warn("[HeaderHospitalBrand] Pharmacy profile query failed, trying agent profile fallback:", err);
          const agentProfile = await getAgentProfile();
          const decoded = accessToken ? decodeJwt(accessToken) : null;
          return {
            status: agentProfile.status,
            message: agentProfile.message,
            data: {
              id: agentProfile.data.id,
              first_name: agentProfile.data.first_name,
              last_name: agentProfile.data.last_name,
              email: agentProfile.data.email,
              phone: agentProfile.data.phone,
              role: (decoded?.role as any) || "PHARMACY_STORE",
              is_active: agentProfile.data.is_active,
              created_at: agentProfile.data.created_at,
              hospital_id: agentProfile.data.hospital_id,
              hospital_name: agentProfile.data.hospital_name,
              hospital_code: agentProfile.data.hospital_code,
              hospital_modules: {
                has_pharmacy_module: true,
                allow_pharmacy_self_pay: true,
                allow_agent_pharmacy_pay: true,
                allow_pharmacy_walk_in: true,
              },
              modules: agentProfile.data.modules,
            },
          } as any;
        }
      }
      return section === "fo" ? getFoProfile() : getAgentProfile();
    },
    enabled: Boolean(accessToken && (section === "fo" || section === "agent" || section === "pharmacy")),
    staleTime: 1000 * 60 * 5,
  });

  const hospitalId = profileQuery.data?.data.hospital_id ?? "";

  const hospitalImageQuery = useQuery({
    queryKey: [section, "header-hospital-image", hospitalId],
    queryFn: async () =>
      section === "fo"
        ? getFoHospitalImageUrl(hospitalId)
        : getAgentHospitalImageUrl(hospitalId),
    enabled: Boolean(
      accessToken &&
        hospitalId &&
        (section === "fo" || section === "agent" || section === "pharmacy"),
    ),
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (accessToken) {
      const decoded = decodeJwt(accessToken);
      console.log("[HeaderHospitalBrand] profileQuery data:", profileQuery.data);
      console.log("[HeaderHospitalBrand] hospitalImageQuery data:", hospitalImageQuery.data);
      console.log("[HeaderHospitalBrand] decoded JWT claims:", decoded);
    }
  }, [accessToken, profileQuery.data, hospitalImageQuery.data]);

  const brand = useMemo(() => {
    if (section === "admin") {
      return {
        isPlatformLogo: true,
        label: "Platform",
        title: "SwiftRev HQ",
        subtitle: "Central operations dashboard",
        imageUrl: PLATFORM_LOGO_SRC,
      };
    }

    const decoded = accessToken ? decodeJwt(accessToken) : null;
    const tokenUser = decoded?.user ?? decoded?.data ?? decoded ?? {};

    const profile = profileQuery.data?.data;
    const imageData = hospitalImageQuery.data?.data;

    const hospitalName = imageData?.hospital_name || profile?.hospital_name || decoded?.hospital_name || decoded?.hospitalName || tokenUser?.hospital_name || tokenUser?.hospitalName || "Hospital";
    const hospitalCode = profile?.hospital_code || decoded?.hospital_code || decoded?.hospitalCode || tokenUser?.hospital_code || tokenUser?.hospitalCode || "Connected workspace";

    if (!profile) {
      return {
        isPlatformLogo: false,
        label:
          section === "fo"
            ? "FO"
            : section === "pharmacy"
              ? "Pharmacy"
              : "Agent",
        title: hospitalName === "Hospital" && hospitalImageQuery.isLoading ? "Loading hospital..." : hospitalName,
        subtitle: hospitalCode,
        imageUrl: "",
      };
    }

    return {
      isPlatformLogo: false,
      label:
        section === "fo"
          ? "MDA Workspace"
          : section === "pharmacy"
            ? "Pharmacy Workspace"
            : "Agent Workspace",
      title: hospitalName,
      subtitle: hospitalCode,
      imageUrl: imageData?.image_url ?? "",
    };
  }, [hospitalImageQuery.data, hospitalImageQuery.isLoading, profileQuery.data, accessToken, section]);

  if (section === "default" || !hydrated || !accessToken) {
    return null;
  }

  return (
    <div className="hidden min-w-0 items-center gap-3 rounded-2xl border border-line-subtle bg-linear-to-r from-brand-50 via-white to-canvas-alt px-3 py-2 shadow-sm lg:flex dark:border-line-subtle dark:from-panel dark:via-panel dark:to-panel-strong">
      <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/70 bg-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {brand.imageUrl ? (
          <img
            src={brand.imageUrl}
            alt={brand.title}
            className={`h-full w-full ${
              brand.isPlatformLogo ? "object-contain p-1.5" : "object-cover"
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-brand-700 to-brand-400 text-white">
            <FiActivity className="text-lg" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/20 via-transparent to-transparent" />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {brand.label}
        </p>
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
          {brand.title}
        </p>
        <p className="truncate text-xs text-slate-600 dark:text-slate-400">
          {brand.subtitle}
        </p>
      </div>
    </div>
  );
}
