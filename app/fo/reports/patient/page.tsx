"use client";

import FoScopedReportWorkspace from "@/components/FoScopedReportWorkspace";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import {
  exportFoPatientReportCsv,
  getFoPatientReport,
  getFoProfile,
  printFoPatientReport,
  searchFoHospitalPatients,
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
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const deferredPatientQuery = useDeferredValue(patientQuery.trim());
  const dateRangeIsInvalid = Boolean(
    startDate && endDate && startDate > endDate,
  );

  const profileQuery = useQuery({
    queryKey: ["fo-profile"],
    queryFn: getFoProfile,
    enabled: Boolean(accessToken),
  });

  const hospitalId = profileQuery.data?.data.hospital_id ?? "";

  const patientLookupQuery = useQuery({
    queryKey: ["fo-patient-report-search", hospitalId, deferredPatientQuery],
    queryFn: () =>
      searchFoHospitalPatients(hospitalId, {
        query: deferredPatientQuery,
        limit: 20,
      }),
    enabled: Boolean(accessToken && hospitalId && deferredPatientQuery),
  });

  const patientOptions = useMemo(() => {
    return (patientLookupQuery.data?.data.patients ?? []).map((item) => ({
      id: item.patient_id,
      name: item.display_value,
      description: item.phone_number,
    }));
  }, [patientLookupQuery.data?.data.patients]);

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
    const error =
      patientLookupQuery.error instanceof ApiError
        ? patientLookupQuery.error
        : profileQuery.error instanceof ApiError
          ? profileQuery.error
          : null;

    if (!error) {
      return;
    }

    if (error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [patientLookupQuery.error, profileQuery.error, router]);

  return (
    <FoScopedReportWorkspace
      mode="patient"
      title="Patient Report"
      subtitle="Review revenue and transaction activity for a specific patient"
      filterLabel="Patient"
      filterType="search-select"
      filterValue={patientQuery}
      onFilterChange={(value) => {
        setPatientQuery(value);
        setSelectedPatientId("");
      }}
      onFilterOptionSelect={(option) => {
        setPatientQuery(option.name);
        setSelectedPatientId(option.id);
      }}
      filterSearchOptions={patientOptions}
      isFilterOptionSelected={Boolean(selectedPatientId)}
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
            : profileQuery.error instanceof Error
              ? profileQuery.error.message
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
