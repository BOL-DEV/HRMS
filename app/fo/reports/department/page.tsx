"use client";

import FoScopedReportWorkspace from "@/components/fo/FoScopedReportWorkspace";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import {
  exportFoDepartmentReportCsv,
  getFoDepartmentReport,
  getFoDepartments,
  printFoDepartmentReport,
} from "@/libs/fo-auth";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

const REPORTS_PER_PAGE = 15;

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();
  const today = getTodayDate();
  const [department, setDepartment] = useState("All");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [page, setPage] = useState(1);

  const dateRangeIsInvalid = Boolean(
    startDate && endDate && startDate > endDate,
  );

  const departmentsQuery = useQuery({
    queryKey: ["fo-report-departments"],
    queryFn: () => getFoDepartments(),
    enabled: Boolean(accessToken),
  });

  const reportQuery = useQuery({
    queryKey: ["fo-department-report", department, startDate, endDate, page],
    queryFn: () =>
      getFoDepartmentReport({
        department: department === "All" ? undefined : department,
        startDate,
        endDate,
        page: department === "All" ? undefined : page,
        limit: department === "All" ? undefined : REPORTS_PER_PAGE,
      }),
    enabled: Boolean(accessToken) && !dateRangeIsInvalid,
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
        : departmentsQuery.error instanceof ApiError
          ? departmentsQuery.error
          : null;

    if (!error) {
      return;
    }

    if (error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [departmentsQuery.error, reportQuery.error, router]);

  const options = useMemo(
    () =>
      (departmentsQuery.data?.data.departments ?? []).map((item) => ({
        // Backend matches by department name, not UUID.
        id: item.name,
        name: item.name,
      })),
    [departmentsQuery.data?.data.departments],
  );

  const pagination =
    department === "All" ? null : reportQuery.data?.data.pagination ?? null;

  const handleDepartmentChange = (value: string) => {
    setDepartment(value);
    setPage(1);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setPage(1);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setPage(1);
  };

  return (
    <FoScopedReportWorkspace
      mode="department"
      title="Department Report"
      subtitle="Analyze transactions and revenue across a department selection"
      filterLabel="Department"
      filterType="select"
      filterValue={department}
      onFilterChange={handleDepartmentChange}
      filterOptions={options}
      isFilterLoading={departmentsQuery.isLoading}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={handleStartDateChange}
      onEndDateChange={handleEndDateChange}
      onExport={() =>
        exportFoDepartmentReportCsv({
          department: department === "All" ? undefined : department,
          startDate,
          endDate,
          page: department === "All" ? undefined : page,
          limit: department === "All" ? undefined : REPORTS_PER_PAGE,
        }).catch((error) =>
          toast.error(
            error instanceof Error ? error.message : "Unable to export report.",
          ),
        )
      }
      onPrint={() =>
        printFoDepartmentReport({
          department: department === "All" ? undefined : department,
          startDate,
          endDate,
          page: department === "All" ? undefined : page,
          limit: department === "All" ? undefined : REPORTS_PER_PAGE,
        }).catch((error) =>
          toast.error(
            error instanceof Error ? error.message : "Unable to print report.",
          ),
        )
      }
      errorMessage={
        reportQuery.error instanceof Error
          ? reportQuery.error.message
          : departmentsQuery.error instanceof Error
            ? departmentsQuery.error.message
            : null
      }
      dateRangeErrorMessage={
        dateRangeIsInvalid ? "Start date cannot be after the end date." : null
      }
      isLoading={reportQuery.isLoading}
      data={reportQuery.data?.data}
      pagination={pagination}
      onPreviousPage={() => setPage((current) => Math.max(current - 1, 1))}
      onNextPage={() =>
        setPage((current) =>
          Math.min(
            current + 1,
            reportQuery.data?.data.pagination?.total_pages ?? current,
          ),
        )
      }
    />
  );
}

export default Page;
