"use client";

import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import TransactionActionBar from "@/components/TransactionActionBar";
import TransactionList from "@/components/TransactionList";
import CreateNewTransaction from "@/components/CreateNewTransaction";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiCircle, FiCreditCard, FiHash, FiInbox } from "react-icons/fi";
import { formatDateTime } from "@/libs/helper";
import { formatNaira } from "@/libs/helper";
import { getAgentDepartments, getAgentTransactions } from "@/libs/agent-auth";
import { ApiError } from "@/libs/api";
import { clearAgentTokens, getAgentAccessToken } from "@/libs/auth";
import type { AgentTransactionsTimePeriod } from "@/libs/type";

function Page() {
  const router = useRouter();
  const [openNewTransaction, setOpenNewTransaction] = useState(false);
  const [timePeriod, setTimePeriod] =
    useState<AgentTransactionsTimePeriod>("today");
  const [paymentType, setPaymentType] = useState("all");
  const [department, setDepartment] = useState("all");
  const [page, setPage] = useState(1);
  const accessToken = getAgentAccessToken();

  const departmentsQuery = useQuery({
    queryKey: ["agent-departments"],
    queryFn: getAgentDepartments,
    enabled: Boolean(accessToken),
  });

  const transactionsQuery = useQuery({
    queryKey: [
      "agent-transactions",
      timePeriod,
      paymentType,
      department,
      page,
    ],
    queryFn: () =>
      getAgentTransactions({
        timePeriod,
        paymentType,
        department,
        page,
      }),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    const error = transactionsQuery.error ?? departmentsQuery.error;

    if (!(error instanceof ApiError)) {
      return;
    }

    if (error.status === 401) {
      clearAgentTokens();
      router.replace("/login");
    }
  }, [transactionsQuery.error, departmentsQuery.error, router]);

  const stats = useMemo(() => {
    const data = transactionsQuery.data?.data;

    if (!data) {
      return [];
    }

    return [
      {
        title: "Current Balance",
        value: formatNaira(data.balance),
        icon: <FiCircle className="text-xl" />,
      },
      {
        title: "Last Wallet Credit",
        value: formatNaira(data.last_wallet_credit),
        icon: <FiCreditCard className="text-xl" />,
      },
      {
        title: "Disbursed Amount",
        value: formatNaira(data.summary.disbursed_amount),
        icon: <FiInbox className="text-xl" />,
      },
      {
        title: "Count",
        value: String(data.summary.transaction_count),
        icon: <FiHash className="text-xl" />,
      },
    ];
  }, [transactionsQuery.data]);

  const rows = useMemo(
    () =>
      (transactionsQuery.data?.data.transactions ?? []).map((transaction) => ({
        id: transaction.id,
        receiptNo: transaction.receipt_no,
        patientName: transaction.patient_name,
        phoneNumber: transaction.phone_number,
        department: transaction.department,
        billName: transaction.bill_name,
        amount: Number(transaction.amount),
        paymentType: transaction.payment_type,
        status: transaction.status,
        createdAt: formatDateTime(transaction.created_at),
      })),
    [transactionsQuery.data],
  );

  const pagination = transactionsQuery.data?.data.pagination;
  const departments =
    departmentsQuery.data?.data.map((department) => department.name) ?? [];

  const handleFilterChange = (
    setter: (value: string) => void,
    value: string,
  ) => {
    setter(value);
    setPage(1);
  };

  const statusMessage =
    transactionsQuery.error instanceof Error
      ? transactionsQuery.error.message
      : departmentsQuery.error instanceof Error
        ? departmentsQuery.error.message
        : null;

  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto">
      <Header
        title="Transactions"
        Subtitle="Review processed payments, filters, and receipt history"
      />

      <div className="p-6 space-y-6">
        <TransactionActionBar
          departments={departments}
          selectedDepartment={department}
          selectedPaymentType={paymentType}
          selectedTimePeriod={timePeriod}
          onDepartmentChange={(value) =>
            handleFilterChange(setDepartment, value)
          }
          onPaymentTypeChange={(value) =>
            handleFilterChange(setPaymentType, value)
          }
          onTimePeriodChange={(value) =>
            handleFilterChange(
              (nextValue) =>
                setTimePeriod(nextValue as AgentTransactionsTimePeriod),
              value,
            )
          }
          onNewTransaction={() => setOpenNewTransaction(true)}
          onRefresh={() => transactionsQuery.refetch()}
          isRefreshing={transactionsQuery.isFetching}
          onExport={() => window.print()}
        />

        {statusMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {statusMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {transactionsQuery.isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/40"
                />
              ))
            : stats.map((s) => (
                <StatCard
                  key={s.title}
                  title={s.title}
                  value={s.value}
                  icon={s.icon}
                />
              ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <TransactionList
            rows={rows}
            totalCount={pagination?.total_transactions ?? 0}
            isLoading={transactionsQuery.isLoading}
          />
        </div>

        {pagination ? (
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Page {pagination.current_page} of {pagination.total_pages}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!pagination.has_previous}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!pagination.has_next}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <CreateNewTransaction
        open={openNewTransaction}
        onClose={() => setOpenNewTransaction(false)}
        onSuccess={async () => {
          await transactionsQuery.refetch();
        }}
      />
    </div>
  );
}

export default Page;
