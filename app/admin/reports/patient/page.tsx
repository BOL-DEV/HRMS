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
  const [showAll, setShowAll] = useState(false);

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

  const trimmedPatientId = patientId.trim();
  const patientIdIsValid =
    !trimmedPatientId || isNumericPatientId(trimmedPatientId);
  const dateRangeIsInvalid =
    !showAll && Boolean(startDate && endDate && startDate > endDate);
  const applied =
    !selectedHospitalId || !patientIdIsValid || dateRangeIsInvalid
      ? null
      : {
          hospitalId: selectedHospitalId,
          patientId: trimmedPatientId,
          startDate: showAll ? "" : startDate,
          endDate: showAll ? "" : endDate,
        };

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
        setShowAll(false);
      }}
      hospitalOptions={hospitals}
      filterLabel="Patient ID"
      filterValue={patientId}
      onFilterChange={(value) => {
        setPatientId(value);
        setShowAll(false);
      }}
      filterPlaceholder="Enter patient ID"
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={(value) => {
        setStartDate(value);
        setShowAll(false);
      }}
      onEndDateChange={(value) => {
        setEndDate(value);
        setShowAll(false);
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

        setShowAll(true);
        setStartDate("");
        setEndDate("");
      }}
      onExport={() =>
        !applied.hospitalId
          ? Promise.resolve(toast.error("Select a hospital to export reports."))
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
          ? Promise.resolve(toast.error("Select a hospital to print reports."))
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
