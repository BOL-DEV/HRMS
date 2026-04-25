"use client";

import FoScopedReportWorkspace from "@/components/FoScopedReportWorkspace";
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

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getRelativeDate(daysFromToday: number) {
  const today = new Date();
  today.setDate(today.getDate() + daysFromToday);
  return formatDateOnly(today);
}

function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();
  const [department, setDepartment] = useState("All");
  const [startDate, setStartDate] = useState(() => getRelativeDate(-6));
  const [endDate, setEndDate] = useState(() => getRelativeDate(0));
  const [applied, setApplied] = useState({
    department: "All",
    startDate: getRelativeDate(-6),
    endDate: getRelativeDate(0),
  });

  const departmentsQuery = useQuery({
    queryKey: ["fo-report-departments"],
    queryFn: () => getFoDepartments(),
    enabled: Boolean(accessToken),
  });

  const reportQuery = useQuery({
    queryKey: ["fo-department-report", applied],
    queryFn: () =>
      getFoDepartmentReport({
        department: applied.department === "All" ? undefined : applied.department,
        startDate: applied.startDate,
        endDate: applied.endDate,
      }),
    enabled: Boolean(accessToken),
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

  return (
    <FoScopedReportWorkspace
      mode="department"
      title="Department Report"
      subtitle="Analyze transactions and revenue across a department selection"
      filterLabel="Department"
      filterType="select"
      filterValue={department}
      onFilterChange={setDepartment}
      filterOptions={options}
      isFilterLoading={departmentsQuery.isLoading}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      onGenerate={() =>
        setApplied({
          department,
          startDate,
          endDate,
        })
      }
      onExport={() =>
        exportFoDepartmentReportCsv({
          department: applied.department === "All" ? undefined : applied.department,
          startDate: applied.startDate,
          endDate: applied.endDate,
        }).catch((error) =>
          toast.error(
            error instanceof Error ? error.message : "Unable to export report.",
          ),
        )
      }
      onPrint={() =>
        printFoDepartmentReport({
          department: applied.department === "All" ? undefined : applied.department,
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
          : departmentsQuery.error instanceof Error
            ? departmentsQuery.error.message
            : null
      }
      isLoading={reportQuery.isLoading}
      data={reportQuery.data?.data}
    />
  );
}

export default Page;
