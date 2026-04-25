"use client";

import AdminPageError from "@/components/AdminPageError";
import AdminPaginationFooter from "@/components/AdminPaginationFooter";
import AdminHospitalTransactionsSection from "@/components/AdminHospitalTransactionsSection";
import AdminHospitalTransactionsSummaryCards from "@/components/AdminHospitalTransactionsSummaryCards";
import { ApiError } from "@/libs/api";
import {
  exportAdminHospitalTransactionsCsv,
  getAdminHospitalAgents,
  getAdminHospitalDepartments,
  getAdminHospitalPatientSearch,
  getAdminHospitalTransactions,
} from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

const PAGE_LIMIT = 15;

export default function HospitalTransactionsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const accessToken = getAccessToken();
  const hospitalId = params?.id ?? "";

  const [searchInput, setSearchInput] = useState("");
  const [paymentMethodInput, setPaymentMethodInput] = useState<
    "all" | "cash" | "transfer" | "pos"
  >("all");
  const [patientIdInput, setPatientIdInput] = useState("");
  const [departmentInput, setDepartmentInput] = useState("");
  const [agentInput, setAgentInput] = useState("");
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedPaymentMethod, setAppliedPaymentMethod] = useState<
    "all" | "cash" | "transfer" | "pos"
  >("all");
  const [appliedPatientId, setAppliedPatientId] = useState("");
  const [appliedDepartment, setAppliedDepartment] = useState("");
  const [appliedAgent, setAppliedAgent] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [page, setPage] = useState(1);
  const deferredPatientId = useDeferredValue(patientIdInput.trim());

  const patientIdIsNumeric = useMemo(
    () => (deferredPatientId ? /^\d+$/.test(deferredPatientId) : false),
    [deferredPatientId],
  );

  const transactionsQuery = useQuery({
    queryKey: [
      "admin-hospital-transactions",
      hospitalId,
      appliedSearch,
      appliedPaymentMethod,
      appliedPatientId,
      appliedDepartment,
      appliedAgent,
      appliedStartDate,
      appliedEndDate,
      page,
    ],
    queryFn: () =>
      getAdminHospitalTransactions(hospitalId, {
        search: appliedSearch,
        paymentMethod:
          appliedPaymentMethod === "all" ? undefined : appliedPaymentMethod,
        patientId: appliedPatientId || undefined,
        department: appliedDepartment || undefined,
        agent: appliedAgent || undefined,
        startDate: appliedStartDate || undefined,
        endDate: appliedEndDate || undefined,
        page,
        limit: PAGE_LIMIT,
      }),
    enabled: Boolean(accessToken && hospitalId),
  });

  const patientSearchQuery = useQuery({
    queryKey: ["admin-hospital-patient-search", hospitalId, deferredPatientId],
    queryFn: () =>
      getAdminHospitalPatientSearch(hospitalId, {
        query: deferredPatientId,
        limit: 10,
      }),
    enabled: Boolean(accessToken && hospitalId && deferredPatientId && patientIdIsNumeric),
  });

  const departmentsQuery = useQuery({
    queryKey: ["admin-hospital-transactions-departments", hospitalId],
    queryFn: () => getAdminHospitalDepartments(hospitalId),
    enabled: Boolean(accessToken && hospitalId),
  });

  const agentsQuery = useQuery({
    queryKey: ["admin-hospital-transactions-agents", hospitalId],
    queryFn: () => getAdminHospitalAgents(hospitalId),
    enabled: Boolean(accessToken && hospitalId),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    const error =
      transactionsQuery.error instanceof ApiError
        ? transactionsQuery.error
        : patientSearchQuery.error instanceof ApiError
          ? patientSearchQuery.error
          : departmentsQuery.error instanceof ApiError
            ? departmentsQuery.error
            : agentsQuery.error instanceof ApiError
              ? agentsQuery.error
          : null;

    if (!error) {
      return;
    }

    if (error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
      return;
    }

    if (error.status === 404) {
      router.replace("/admin/hospitals");
    }
  }, [
    agentsQuery.error,
    departmentsQuery.error,
    patientSearchQuery.error,
    router,
    transactionsQuery.error,
  ]);

  const transactionsData = transactionsQuery.data?.data;
  const pagination = transactionsData?.pagination;
  const rows = transactionsData?.transactions ?? [];

  const applyFilters = () => {
    const hasAnyDate = Boolean(startDateInput || endDateInput);

    if (hasAnyDate && (!startDateInput || !endDateInput)) {
      return;
    }

    setAppliedSearch(searchInput.trim());
    setAppliedPaymentMethod(paymentMethodInput);
    setAppliedPatientId(patientIdInput.trim());
    setAppliedDepartment(departmentInput.trim());
    setAppliedAgent(agentInput.trim());
    setAppliedStartDate(startDateInput);
    setAppliedEndDate(endDateInput);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setPaymentMethodInput("all");
    setPatientIdInput("");
    setDepartmentInput("");
    setAgentInput("");
    setStartDateInput("");
    setEndDateInput("");
    setAppliedSearch("");
    setAppliedPaymentMethod("all");
    setAppliedPatientId("");
    setAppliedDepartment("");
    setAppliedAgent("");
    setAppliedStartDate("");
    setAppliedEndDate("");
    setPage(1);
  };

  const handleExport = () => {
    exportAdminHospitalTransactionsCsv(hospitalId, {
      search: appliedSearch || undefined,
      paymentMethod:
        appliedPaymentMethod === "all" ? undefined : appliedPaymentMethod,
      patientId: appliedPatientId || undefined,
      department: appliedDepartment || undefined,
      agent: appliedAgent || undefined,
      startDate: appliedStartDate || undefined,
      endDate: appliedEndDate || undefined,
      page,
      limit: PAGE_LIMIT,
    }).catch((error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to export transactions.",
      );
    });
  };

  const dateRangeIsInvalid =
    Boolean(startDateInput || endDateInput) &&
    (!startDateInput || !endDateInput);

  const departmentOptions = useMemo(() => {
    const raw = departmentsQuery.data?.data.departments ?? [];
    const names = raw.map((item) => (typeof item === "string" ? item : item.name));
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [departmentsQuery.data?.data.departments]);

  const agentOptions = useMemo(() => {
    const raw = agentsQuery.data?.data.agent_name_list ?? [];
    const names = raw.map((item) => item.agent_name);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [agentsQuery.data?.data.agent_name_list]);

  return (
    <div className="space-y-6">
      {transactionsQuery.error instanceof Error ? (
        <AdminPageError message={transactionsQuery.error.message} />
      ) : null}

      <AdminHospitalTransactionsSummaryCards
        totalRevenue={transactionsData?.summary.total_revenue ?? 0}
        transactionCount={transactionsData?.summary.transaction_count ?? 0}
      />

      <div className="space-y-0 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <AdminHospitalTransactionsSection
          rows={rows}
          search={searchInput}
          paymentMethod={paymentMethodInput}
          patientId={patientIdInput}
          patientSuggestions={patientSearchQuery.data?.data.patients ?? []}
          isPatientSuggestionsLoading={patientSearchQuery.isLoading}
          department={departmentInput}
          departmentOptions={departmentOptions}
          agent={agentInput}
          agentOptions={agentOptions}
          startDate={startDateInput}
          endDate={endDateInput}
          isLoading={transactionsQuery.isLoading && !transactionsQuery.data}
          isDateRangeInvalid={dateRangeIsInvalid}
          onSearchChange={setSearchInput}
          onPaymentMethodChange={setPaymentMethodInput}
          onPatientIdChange={setPatientIdInput}
          onDepartmentChange={setDepartmentInput}
          onAgentChange={setAgentInput}
          onStartDateChange={setStartDateInput}
          onEndDateChange={setEndDateInput}
          onApply={applyFilters}
          onClear={clearFilters}
          onExport={handleExport}
        />

        <AdminPaginationFooter
          currentPage={pagination?.current_page ?? 1}
          totalPages={pagination?.total_pages ?? 1}
          hasPrevious={Boolean(pagination?.has_previous)}
          hasNext={Boolean(pagination?.has_next)}
          onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
          onNext={() => setPage((current) => current + 1)}
        />
      </div>
    </div>
  );
}
