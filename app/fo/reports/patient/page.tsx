"use client";

import FoScopedReportWorkspace from "@/components/FoScopedReportWorkspace";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import {
  exportFoPatientReportCsv,
  getFoPatientReport,
  getFoTransactions,
  printFoPatientReport,
} from "@/libs/fo-auth";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();
  const today = getTodayDate();
  const [patientQuery, setPatientQuery] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const deferredPatientQuery = useDeferredValue(patientQuery.trim());
  const dateRangeIsInvalid = Boolean(
    startDate && endDate && startDate > endDate,
  );

  const patientLookupQuery = useQuery({
    queryKey: ["fo-patient-report-search", deferredPatientQuery],
    queryFn: () =>
      getFoTransactions({
        search: deferredPatientQuery,
        limit: 20,
      }),
    enabled: Boolean(accessToken && deferredPatientQuery),
  });

  const patientOptions = useMemo(() => {
    const seen = new Set<string>();
    const query = deferredPatientQuery.toLowerCase();

    return (patientLookupQuery.data?.data.transactions ?? [])
      .filter((item) => {
        if (!item.patient_id || seen.has(item.patient_id)) {
          return false;
        }

        const matches =
          !query ||
          item.patient_id.toLowerCase().includes(query) ||
          item.patient_name.toLowerCase().includes(query);

        if (!matches) {
          return false;
        }

        seen.add(item.patient_id);
        return true;
      })
      .map((item) => ({
        id: item.patient_id,
        name: `${item.patient_name} (${item.patient_id})`,
        description: item.department,
      }));
  }, [deferredPatientQuery, patientLookupQuery.data?.data.transactions]);

  const selectedPatientId = useMemo(() => {
    const trimmedQuery = patientQuery.trim();
    const exactSuggestion = patientOptions.find(
      (item) => item.id === trimmedQuery || item.name === trimmedQuery,
    );

    if (exactSuggestion) {
      return exactSuggestion.id;
    }

    return /^\d+$/.test(trimmedQuery) ? trimmedQuery : "";
  }, [patientOptions, patientQuery]);

  const reportQuery = useQuery({
    queryKey: ["fo-patient-report", selectedPatientId, startDate, endDate],
    queryFn: () =>
      getFoPatientReport({
        patientId: selectedPatientId,
        startDate,
        endDate,
      }),
    enabled: Boolean(accessToken && selectedPatientId) && !dateRangeIsInvalid,
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

  useEffect(() => {
    if (!(patientLookupQuery.error instanceof ApiError)) {
      return;
    }

    if (patientLookupQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [patientLookupQuery.error, router]);

  return (
    <FoScopedReportWorkspace
      mode="patient"
      title="Patient Report"
      subtitle="Review revenue and transaction activity for a specific patient"
      filterLabel="Patient"
      filterType="search-select"
      filterValue={patientQuery}
      onFilterChange={setPatientQuery}
      onFilterOptionSelect={(option) => setPatientQuery(option.id)}
      filterSearchOptions={patientOptions}
      filterPlaceholder="Search patient by ID or name"
      emptyFilterSearchMessage="No matching patients found."
      isFilterSearchLoading={patientLookupQuery.isLoading}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      onViewAllReports={() => {
        if (!selectedPatientId) {
          toast.error("Enter a patient ID to view all patient reports.");
          return;
        }

        setStartDate("");
        setEndDate("");
      }}
      onExport={() =>
        !selectedPatientId
          ? Promise.resolve(toast.error("Generate a patient report before exporting."))
          : exportFoPatientReportCsv({
              patientId: selectedPatientId,
              startDate,
              endDate,
            }).catch((error) =>
              toast.error(
                error instanceof Error ? error.message : "Unable to export report.",
              ),
            )
      }
      onPrint={() =>
        !selectedPatientId
          ? Promise.resolve(toast.error("Generate a patient report before printing."))
          : printFoPatientReport({
              patientId: selectedPatientId,
              startDate,
              endDate,
            }).catch((error) =>
              toast.error(
                error instanceof Error ? error.message : "Unable to print report.",
              ),
            )
      }
      errorMessage={
        reportQuery.error instanceof Error
          ? reportQuery.error.message
          : patientLookupQuery.error instanceof Error
            ? patientLookupQuery.error.message
            : null
      }
      dateRangeErrorMessage={
        dateRangeIsInvalid ? "Start date cannot be after the end date." : null
      }
      isLoading={reportQuery.isLoading}
      data={reportQuery.data?.data}
    />
  );
}

export default Page;
