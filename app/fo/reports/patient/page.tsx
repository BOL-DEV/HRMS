"use client";

import FoScopedReportWorkspace from "@/components/FoScopedReportWorkspace";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import {
  exportFoPatientReportCsv,
  getFoPatientReport,
  printFoPatientReport,
} from "@/libs/fo-auth";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getRelativeDate(daysFromToday: number) {
  const today = new Date();
  today.setDate(today.getDate() + daysFromToday);
  return formatDateOnly(today);
}

function isNumericPatientId(value: string) {
  return /^\d+$/.test(value);
}

function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();
  const [patientId, setPatientId] = useState("");
  const [startDate, setStartDate] = useState(() => getRelativeDate(-6));
  const [endDate, setEndDate] = useState(() => getRelativeDate(0));
  const [applied, setApplied] = useState({
    patientId: "",
    startDate: getRelativeDate(-6),
    endDate: getRelativeDate(0),
  });

  const reportQuery = useQuery({
    queryKey: ["fo-patient-report", applied],
    queryFn: () =>
      getFoPatientReport({
        patientId: applied.patientId,
        startDate: applied.startDate,
        endDate: applied.endDate,
      }),
    enabled: Boolean(accessToken) && Boolean(applied.patientId),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(reportQuery.error instanceof ApiError)) {
      return;
    }

    if (reportQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [reportQuery.error, router]);

  return (
    <FoScopedReportWorkspace
      mode="patient"
      title="Patient Report"
      subtitle="Review revenue and transaction activity for a specific patient"
      filterLabel="Patient ID"
      filterValue={patientId}
      onFilterChange={setPatientId}
      filterPlaceholder="Enter patient ID"
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      onGenerate={() => {
        const trimmedPatientId = patientId.trim();

        if (!trimmedPatientId) {
          toast.error("Enter a patient ID to generate the report.");
          return;
        }

        if (!isNumericPatientId(trimmedPatientId)) {
          toast.error("Patient ID must contain only numbers.");
          return;
        }

        setApplied({
          patientId: trimmedPatientId,
          startDate,
          endDate,
        });
      }}
      onExport={() =>
        !applied.patientId
          ? Promise.resolve(toast.error("Generate a patient report before exporting."))
          : !isNumericPatientId(applied.patientId)
            ? Promise.resolve(toast.error("Patient ID must contain only numbers."))
            :
        exportFoPatientReportCsv({
          patientId: applied.patientId,
          startDate: applied.startDate,
          endDate: applied.endDate,
        }).catch((error) =>
          toast.error(
            error instanceof Error ? error.message : "Unable to export report.",
          ),
        )
      }
      onPrint={() =>
        !applied.patientId
          ? Promise.resolve(toast.error("Generate a patient report before printing."))
          : !isNumericPatientId(applied.patientId)
            ? Promise.resolve(toast.error("Patient ID must contain only numbers."))
            :
        printFoPatientReport({
          patientId: applied.patientId,
          startDate: applied.startDate,
          endDate: applied.endDate,
        }).catch((error) =>
          toast.error(
            error instanceof Error ? error.message : "Unable to print report.",
          ),
        )
      }
      errorMessage={
        reportQuery.error instanceof Error ? reportQuery.error.message : null
      }
      isLoading={reportQuery.isLoading}
      data={reportQuery.data?.data}
    />
  );
}

export default Page;
