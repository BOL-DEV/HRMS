"use client";

import AdminScopedReportWorkspace from "@/components/AdminScopedReportWorkspace";
import { ApiError } from "@/libs/api";
import {
  exportAdminHospitalPatientReportCsv,
  getAdminHospitalPatientReport,
  getAdminReportsOptions,
  printAdminHospitalPatientReport,
} from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function isNumericPatientId(value: string) {
  return /^\d+$/.test(value);
}

export default function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();
  const today = getTodayDate();
  const [hospitalId, setHospitalId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [applied, setApplied] = useState({
    hospitalId: "",
    patientId: "",
    startDate: today,
    endDate: today,
  });

  const optionsQuery = useQuery({
    queryKey: ["admin-patient-report-options"],
    queryFn: getAdminReportsOptions,
    enabled: Boolean(accessToken),
  });

  const hospitals = optionsQuery.data?.data.hospitals ?? [];
  const selectedHospitalId = hospitalId || hospitals[0]?.hospital_id || "";

  const reportQuery = useQuery({
    queryKey: ["admin-patient-report", applied],
    queryFn: () =>
      getAdminHospitalPatientReport(applied.hospitalId, {
        patientId: applied.patientId,
        startDate: applied.startDate,
        endDate: applied.endDate,
      }),
    enabled: Boolean(accessToken && applied.hospitalId),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    const error =
      reportQuery.error instanceof ApiError
        ? reportQuery.error
        : optionsQuery.error instanceof ApiError
          ? optionsQuery.error
          : null;

    if (!error) {
      return;
    }

    if (error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [optionsQuery.error, reportQuery.error, router]);

  return (
    <AdminScopedReportWorkspace
      mode="patient"
      title="Patient Report"
      subtitle="Review billed activity for a patient inside the selected hospital"
      hospitalId={selectedHospitalId}
      onHospitalChange={(value) => {
        setHospitalId(value);
        setApplied((current) => ({
          ...current,
          hospitalId: "",
        }));
      }}
      hospitalOptions={hospitals}
      filterLabel="Patient ID"
      filterValue={patientId}
      onFilterChange={setPatientId}
      filterPlaceholder="Enter patient ID"
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      onGenerate={() => {
        if (!selectedHospitalId) {
          toast.error("Select a hospital to generate the report.");
          return;
        }

        const trimmedPatientId = patientId.trim();

        if (trimmedPatientId && !isNumericPatientId(trimmedPatientId)) {
          toast.error("Patient ID must contain only numbers.");
          return;
        }

        setApplied({
          hospitalId: selectedHospitalId,
          patientId: trimmedPatientId,
          startDate,
          endDate,
        });
      }}
      onViewAllReports={() => {
        if (!selectedHospitalId) {
          toast.error("Select a hospital to view reports.");
          return;
        }

        const trimmedPatientId = patientId.trim();

        if (trimmedPatientId && !isNumericPatientId(trimmedPatientId)) {
          toast.error("Patient ID must contain only numbers.");
          return;
        }

        setStartDate("");
        setEndDate("");
        setApplied({
          hospitalId: selectedHospitalId,
          patientId: trimmedPatientId,
          startDate: "",
          endDate: "",
        });
      }}
      onExport={() =>
        !applied.hospitalId
          ? Promise.resolve(toast.error("Generate a patient report before exporting."))
          : exportAdminHospitalPatientReportCsv(applied.hospitalId, {
              patientId: applied.patientId || undefined,
              startDate: applied.startDate,
              endDate: applied.endDate,
            }).catch((error) =>
              toast.error(
                error instanceof Error ? error.message : "Unable to export report.",
              ),
            )
      }
      onPrint={() =>
        !applied.hospitalId
          ? Promise.resolve(toast.error("Generate a patient report before printing."))
          : printAdminHospitalPatientReport(applied.hospitalId, {
              patientId: applied.patientId || undefined,
              startDate: applied.startDate,
              endDate: applied.endDate,
            }).catch((error) =>
              toast.error(
                error instanceof Error ? error.message : "Unable to print report.",
              ),
            )
      }
      errorMessage={
        reportQuery.error instanceof Error
          ? reportQuery.error.message
          : optionsQuery.error instanceof Error
            ? optionsQuery.error.message
            : null
      }
      isLoading={reportQuery.isLoading}
      data={reportQuery.data?.data}
    />
  );
}
