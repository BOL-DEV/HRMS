"use client";

import AdminPaginationFooter from "@/components/AdminPaginationFooter";
import AdminScopedReportWorkspace from "@/components/AdminScopedReportWorkspace";
import { ApiError } from "@/libs/api";
import {
  exportAdminHospitalDepartmentReportCsv,
  getAdminHospitalDepartmentReport,
  getAdminHospitalDepartments,
  getAdminReportsOptions,
  printAdminHospitalDepartmentReport,
} from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

const REPORTS_PER_PAGE = 15;

export default function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();
  const today = getTodayDate();
  const [hospitalId, setHospitalId] = useState("");
  const [department, setDepartment] = useState("All");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [page, setPage] = useState(1);

  const optionsQuery = useQuery({
    queryKey: ["admin-department-report-options"],
    queryFn: getAdminReportsOptions,
    enabled: Boolean(accessToken),
  });

  const hospitals = optionsQuery.data?.data.hospitals ?? [];
  const selectedHospitalId = hospitalId || hospitals[0]?.hospital_id || "";

  const departmentsQuery = useQuery({
    queryKey: ["admin-department-report-departments", selectedHospitalId],
    queryFn: () => getAdminHospitalDepartments(selectedHospitalId),
    enabled: Boolean(accessToken && selectedHospitalId),
  });

  const reportQuery = useQuery({
    queryKey: ["admin-department-report", applied],
    queryFn: () =>
      getAdminHospitalDepartmentReport(applied.hospitalId, {
        department: applied.department === "All" ? undefined : applied.department,
        startDate: applied.startDate,
        endDate: applied.endDate,
        page: applied.department === "All" ? undefined : applied.page,
        limit: applied.department === "All" ? undefined : REPORTS_PER_PAGE,
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
        : departmentsQuery.error instanceof ApiError
          ? departmentsQuery.error
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
  }, [departmentsQuery.error, optionsQuery.error, reportQuery.error, router]);

  const departmentOptions = useMemo(
    () =>
      (departmentsQuery.data?.data.departments ?? []).map((item) =>
        typeof item === "string"
          ? {
              id: item,
              name: item,
            }
          : {
              id: item.name,
              name: item.name,
            },
      ),
    [departmentsQuery.data?.data.departments],
  );

  const pagination = reportQuery.data?.data.pagination;
  const dateRangeIsInvalid =
    Boolean(startDate && endDate && startDate > endDate);
  const applied =
    !selectedHospitalId || dateRangeIsInvalid
      ? null
      : {
          hospitalId: selectedHospitalId,
          department,
          startDate,
          endDate,
          page,
        };

  return (
    <>
      <AdminScopedReportWorkspace
        mode="department"
        title="Department Report"
        subtitle="Analyze grouped department performance or one department inside a hospital"
        hospitalId={selectedHospitalId}
        onHospitalChange={(value) => {
          setHospitalId(value);
          setDepartment("All");
          setPage(1);
        }}
        hospitalOptions={hospitals}
        filterLabel="Department"
        filterType="select"
        filterValue={department}
        onFilterChange={(value) => {
          setDepartment(value);
          setPage(1);
        }}
        filterOptions={departmentOptions}
        isFilterLoading={departmentsQuery.isLoading}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={(value) => {
          setStartDate(value);
          setPage(1);
        }}
        onEndDateChange={(value) => {
          setEndDate(value);
          setPage(1);
        }}
        onExport={() =>
          !applied.hospitalId
            ? Promise.resolve(toast.error("Select a hospital to export reports."))
            : exportAdminHospitalDepartmentReportCsv(applied.hospitalId, {
                department:
                  applied.department === "All" ? undefined : applied.department,
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
            : printAdminHospitalDepartmentReport(applied.hospitalId, {
                department:
                  applied.department === "All" ? undefined : applied.department,
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
              : optionsQuery.error instanceof Error
                ? optionsQuery.error.message
                : null
        }
        isLoading={reportQuery.isLoading}
        data={reportQuery.data?.data}
      />

      {applied.department !== "All" && pagination ? (
        <div className="-mt-6 px-6 pb-6">
          <div className="rounded-xl border border-line-subtle bg-panel">
            <AdminPaginationFooter
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              hasPrevious={pagination.has_previous}
              hasNext={pagination.has_next}
              onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
              onNext={() =>
                setPage((current) => Math.min(current + 1, pagination.total_pages))
              }
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
