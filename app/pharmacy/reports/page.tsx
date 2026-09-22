"use client";

import React, { useState, useMemo, useEffect } from "react";
import Header from "@/components/shared/Header";
import { useQuery } from "@tanstack/react-query";
import { getAgentAccessToken, decodeJwt } from "@/libs/auth";
import { getPharmacyProfile, getPharmacyStoreProfile } from "@/libs/pharmacy-api";
import {
  getDrugSalesReport,
  getDetailedDispenseReport,
  getStockInventoryReport,
  getExpiryReport,
  getPharmacistPerformanceReport,
  getReturnsExchangesReport,
  openPharmacyReportPrint,
  downloadPharmacyReportCsv,
} from "@/libs/pharmacy-reports";
import DrugSalesReportTab from "@/components/pharmacy/reports/DrugSalesReportTab";
import DetailedDispenseReportTab from "@/components/pharmacy/reports/DetailedDispenseReportTab";
import StockInventoryReportTab from "@/components/pharmacy/reports/StockInventoryReportTab";
import ExpiryAlertsReportTab from "@/components/pharmacy/reports/ExpiryAlertsReportTab";
import PharmacistPerformanceReportTab from "@/components/pharmacy/reports/PharmacistPerformanceReportTab";
import ReturnsExchangesReportTab from "@/components/pharmacy/reports/ReturnsExchangesReportTab";
import {
  FiTrendingUp,
  FiFileText,
  FiPackage,
  FiClock,
  FiUsers,
  FiRepeat,
  FiPrinter,
  FiDownload,
  FiSearch,
  FiCalendar,
  FiRotateCcw,
  FiAlertCircle,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

type ReportTabKey =
  | "drug-report"
  | "detailed-drug-report"
  | "stock-inventory-report"
  | "expiry-report"
  | "pharmacist-performance-report"
  | "returns-exchanges-report";

interface TabDefinition {
  key: ReportTabKey;
  label: string;
  module: string;
  icon: React.ReactNode;
  endpoint: string;
  filePrefix: string;
  roles: string[];
}

const ALL_REPORT_TABS: TabDefinition[] = [
  {
    key: "drug-report",
    label: "Drug Sales Summary",
    module: "drug-report",
    icon: <FiTrendingUp className="text-base" />,
    endpoint: "/api/pharmacy/report/drug",
    filePrefix: "drug_sales_report",
    roles: ["PHARMACY", "PLATFORM_ADMIN"],
  },
  {
    key: "detailed-drug-report",
    label: "Detailed Dispense",
    module: "detailed-drug-report",
    icon: <FiFileText className="text-base" />,
    endpoint: "/api/pharmacy/report/detailed-report",
    filePrefix: "detailed_dispense_report",
    roles: ["PHARMACY", "PLATFORM_ADMIN"],
  },
  {
    key: "stock-inventory-report",
    label: "Stock & Valuation",
    module: "stock-inventory-report",
    icon: <FiPackage className="text-base" />,
    endpoint: "/api/pharmacy/report/stock-inventory",
    filePrefix: "stock_inventory_report",
    roles: ["PHARMACY", "PHARMACY_STORE", "PLATFORM_ADMIN"],
  },
  {
    key: "expiry-report",
    label: "Expiry Alerts",
    module: "expiry-report",
    icon: <FiClock className="text-base" />,
    endpoint: "/api/pharmacy/report/expiry",
    filePrefix: "expiry_report",
    roles: ["PHARMACY", "PHARMACY_STORE", "PLATFORM_ADMIN"],
  },
  {
    key: "pharmacist-performance-report",
    label: "Staff Performance",
    module: "pharmacist-performance-report",
    icon: <FiUsers className="text-base" />,
    endpoint: "/api/pharmacy/report/pharmacist-performance",
    filePrefix: "pharmacist_performance_report",
    roles: ["PHARMACY", "PLATFORM_ADMIN"],
  },
  {
    key: "returns-exchanges-report",
    label: "Returns & Exchanges",
    module: "returns-exchanges-report",
    icon: <FiRepeat className="text-base" />,
    endpoint: "/api/pharmacy/report/returns-exchanges",
    filePrefix: "returns_exchanges_report",
    roles: ["PHARMACY", "PLATFORM_ADMIN"],
  },
];

export default function PharmacyReportsPage() {
  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : null;
  const decoded = useMemo(() => (accessToken ? decodeJwt(accessToken) : null), [accessToken]);

  // Profile Query for RBAC Module permissions
  const { data: profileResponse, isLoading: isProfileLoading } = useQuery({
    queryKey: ["pharmacy-profile-reports", decoded?.role],
    queryFn: async () => {
      if (decoded?.role === "PHARMACY_STORE") {
        return (await getPharmacyStoreProfile()) as any;
      }
      return (await getPharmacyProfile()) as any;
    },
    enabled: Boolean(accessToken),
  });

  const userProfile = profileResponse?.data;
  const userRole = (userProfile?.role as string) || (decoded?.role as string) || "";
  const userModules: string[] = userProfile?.modules || [];
  const isPlatformAdmin = userRole === "PLATFORM_ADMIN";

  // Filter accessible tabs
  const allowedTabs = useMemo(() => {
    return ALL_REPORT_TABS.filter((tab) => {
      if (isPlatformAdmin) return true;
      if (userModules.length > 0) {
        return userModules.includes(tab.module);
      }
      // Fallback role check if modules are not explicitly populated
      return tab.roles.includes(userRole);
    });
  }, [isPlatformAdmin, userModules, userRole]);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<ReportTabKey>("drug-report");

  // Auto-switch to first allowed tab if current active tab is not accessible
  useEffect(() => {
    if (allowedTabs.length > 0 && !allowedTabs.some((t) => t.key === activeTab)) {
      setActiveTab(allowedTabs[0].key);
    }
  }, [allowedTabs, activeTab]);

  // Date Presets Helper (Africa/Lagos Today default)
  const todayStr = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  const [datePreset, setDatePreset] = useState<"today" | "yesterday" | "this_week" | "this_month" | "custom">("today");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const applyDatePreset = (preset: "today" | "yesterday" | "this_week" | "this_month" | "custom") => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === "today") {
      const today = now.toISOString().split("T")[0];
      setStartDate(today);
      setEndDate(today);
    } else if (preset === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split("T")[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === "this_week") {
      const start = new Date(now);
      const day = start.getDay(); // 0 is Sunday
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start.setDate(diff);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (preset === "this_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    }
  };

  // Search filter with debounce
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Contextual Sub-filters
  const [stockStatus, setStockStatus] = useState("all");
  const [expiryTimeframe, setExpiryTimeframe] = useState("all");
  const [exchangeStatus, setExchangeStatus] = useState("all");

  // Pagination states per tab
  const [page, setPage] = useState(1);

  // Reset page when switching tabs or filters
  useEffect(() => {
    setPage(1);
  }, [activeTab, startDate, endDate, debouncedSearch, stockStatus, expiryTimeframe, exchangeStatus]);

  // Handle Full Reset
  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStockStatus("all");
    setExpiryTimeframe("all");
    setExchangeStatus("all");
    applyDatePreset("today");
    setPage(1);
  };

  // Active Tab Configuration
  const currentTabConfig = useMemo(() => {
    return ALL_REPORT_TABS.find((t) => t.key === activeTab) || ALL_REPORT_TABS[0];
  }, [activeTab]);

  // --- Live TanStack Queries ---
  const drugSalesQuery = useQuery({
    queryKey: ["pharmacy-report-drug", startDate, endDate, debouncedSearch, page],
    queryFn: () =>
      getDrugSalesReport({
        start_date: startDate,
        end_date: endDate,
        search: debouncedSearch,
        page,
        limit: 20,
      }),
    enabled: Boolean(accessToken && activeTab === "drug-report"),
  });

  const detailedDispenseQuery = useQuery({
    queryKey: ["pharmacy-report-detailed", startDate, endDate, debouncedSearch, page],
    queryFn: () =>
      getDetailedDispenseReport({
        start_date: startDate,
        end_date: endDate,
        search: debouncedSearch,
        page,
        limit: 20,
      }),
    enabled: Boolean(accessToken && activeTab === "detailed-drug-report"),
  });

  const stockInventoryQuery = useQuery({
    queryKey: ["pharmacy-report-stock", stockStatus, debouncedSearch, page],
    queryFn: () =>
      getStockInventoryReport({
        stock_status: stockStatus,
        search: debouncedSearch,
        page,
        limit: 20,
      }),
    enabled: Boolean(accessToken && activeTab === "stock-inventory-report"),
  });

  const expiryQuery = useQuery({
    queryKey: ["pharmacy-report-expiry", expiryTimeframe, debouncedSearch, page],
    queryFn: () =>
      getExpiryReport({
        timeframe: expiryTimeframe,
        search: debouncedSearch,
        page,
        limit: 20,
      }),
    enabled: Boolean(accessToken && activeTab === "expiry-report"),
  });

  const pharmacistPerformanceQuery = useQuery({
    queryKey: ["pharmacy-report-performance", startDate, endDate, page],
    queryFn: () =>
      getPharmacistPerformanceReport({
        start_date: startDate,
        end_date: endDate,
        page,
        limit: 20,
      }),
    enabled: Boolean(accessToken && activeTab === "pharmacist-performance-report"),
  });

  const returnsExchangesQuery = useQuery({
    queryKey: ["pharmacy-report-returns", startDate, endDate, exchangeStatus, debouncedSearch, page],
    queryFn: () =>
      getReturnsExchangesReport({
        start_date: startDate,
        end_date: endDate,
        status: exchangeStatus,
        search: debouncedSearch,
        page,
        limit: 20,
      }),
    enabled: Boolean(accessToken && activeTab === "returns-exchanges-report"),
  });

  // Export CSV Handler
  const [isExporting, setIsExporting] = useState(false);
  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const filters: Record<string, any> = {
        start_date: startDate,
        end_date: endDate,
        search: debouncedSearch || undefined,
      };

      if (activeTab === "stock-inventory-report") {
        delete filters.start_date;
        delete filters.end_date;
        filters.stock_status = stockStatus;
      } else if (activeTab === "expiry-report") {
        delete filters.start_date;
        delete filters.end_date;
        filters.timeframe = expiryTimeframe;
      } else if (activeTab === "returns-exchanges-report") {
        filters.status = exchangeStatus;
      }

      await downloadPharmacyReportCsv(currentTabConfig.endpoint, filters, currentTabConfig.filePrefix);
      toast.success("Report downloaded successfully as CSV!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  // Print Handler
  const handlePrint = () => {
    const filters: Record<string, any> = {
      start_date: startDate,
      end_date: endDate,
      search: debouncedSearch || undefined,
    };

    if (activeTab === "stock-inventory-report") {
      delete filters.start_date;
      delete filters.end_date;
      filters.stock_status = stockStatus;
    } else if (activeTab === "expiry-report") {
      delete filters.start_date;
      delete filters.end_date;
      filters.timeframe = expiryTimeframe;
    } else if (activeTab === "returns-exchanges-report") {
      filters.status = exchangeStatus;
    }

    openPharmacyReportPrint(currentTabConfig.endpoint, filters);
  };

  if (!accessToken) return null;

  return (
    <div className="min-h-screen w-full bg-canvas text-slate-900 dark:text-slate-100">
      <Header
        title="Pharmacy Reports & Analytics"
        Subtitle="Comprehensive pharmaceutical sales, inventory valuation, expiry risk, and shift audits"
      />

      <div className="space-y-6 p-6">
        {/* Page Top Header Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FiTrendingUp className="text-brand-500" />
              Pharmacy Reports & Audits
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time financial analytics, medication dispense logs, and inventory intelligence.
            </p>
          </div>

          {/* Action Buttons: Print & Export */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
              title="Print full filtered dataset (bypasses pagination)"
            >
              <FiPrinter className="text-slate-400" />
              Print Report
            </button>

            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-brand-500 disabled:opacity-50 transition"
              title="Export complete report to Excel/CSV"
            >
              <FiDownload />
              {isExporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </div>

        {/* Dynamic RBAC Gated Tabs Bar */}
        {allowedTabs.length === 0 && !isProfileLoading ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
            <FiAlertCircle className="mx-auto h-8 w-8 text-amber-600 dark:text-amber-400 mb-2" />
            <h3 className="text-base font-semibold text-amber-900 dark:text-amber-200">
              No Report Modules Assigned
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 max-w-md mx-auto">
              Your user account does not currently have permissions to view any pharmacy reporting modules.
              Please contact the system administrator to assign module access.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {allowedTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                    isActive
                      ? "bg-brand-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Global Toolbar: Date Presets, Custom Range, Search */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Quick Date Presets (Visible on date-dependent tabs) */}
            {activeTab !== "stock-inventory-report" && activeTab !== "expiry-report" ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
                  Preset:
                </span>
                {(
                  [
                    { id: "today", label: "Today" },
                    { id: "yesterday", label: "Yesterday" },
                    { id: "this_week", label: "This Week" },
                    { id: "this_month", label: "This Month" },
                    { id: "custom", label: "Custom" },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyDatePreset(preset.id)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                      datePreset === preset.id
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 font-medium">
                Live Real-Time Inventory Snapshots
              </div>
            )}

            {/* Custom Date Pickers */}
            {activeTab !== "stock-inventory-report" && activeTab !== "expiry-report" && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950/60">
                  <FiCalendar className="text-slate-400" />
                  <span className="text-slate-500 dark:text-slate-400 font-medium">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDatePreset("custom");
                    }}
                    className="bg-transparent text-slate-800 focus:outline-none dark:text-slate-200"
                  />
                </div>

                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950/60">
                  <FiCalendar className="text-slate-400" />
                  <span className="text-slate-500 dark:text-slate-400 font-medium">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDatePreset("custom");
                    }}
                    className="bg-transparent text-slate-800 focus:outline-none dark:text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Search Bar & Clear Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={
                  activeTab === "detailed-drug-report"
                    ? "Search drug, patient name, PID, phone, or billing code..."
                    : activeTab === "expiry-report"
                    ? "Search medication name, generic, or batch number..."
                    : activeTab === "returns-exchanges-report"
                    ? "Search exchange code, patient name, PID, or drug..."
                    : "Search medication or generic name..."
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-950"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-500 dark:text-slate-400 dark:hover:text-brand-400 transition"
            >
              <FiRotateCcw />
              Reset Filters to Today
            </button>
          </div>
        </div>

        {/* Tab Content Sub-views */}
        {activeTab === "drug-report" && (
          <DrugSalesReportTab
            data={drugSalesQuery.data?.data}
            isLoading={drugSalesQuery.isLoading}
            page={page}
            onPageChange={setPage}
            onResetFilters={handleResetFilters}
          />
        )}

        {activeTab === "detailed-drug-report" && (
          <DetailedDispenseReportTab
            data={detailedDispenseQuery.data?.data}
            isLoading={detailedDispenseQuery.isLoading}
            page={page}
            onPageChange={setPage}
            onResetFilters={handleResetFilters}
          />
        )}

        {activeTab === "stock-inventory-report" && (
          <StockInventoryReportTab
            data={stockInventoryQuery.data?.data}
            isLoading={stockInventoryQuery.isLoading}
            page={page}
            stockStatus={stockStatus}
            onStockStatusChange={setStockStatus}
            onPageChange={setPage}
            onResetFilters={handleResetFilters}
          />
        )}

        {activeTab === "expiry-report" && (
          <ExpiryAlertsReportTab
            data={expiryQuery.data?.data}
            isLoading={expiryQuery.isLoading}
            page={page}
            timeframe={expiryTimeframe}
            onTimeframeChange={setExpiryTimeframe}
            onPageChange={setPage}
            onResetFilters={handleResetFilters}
          />
        )}

        {activeTab === "pharmacist-performance-report" && (
          <PharmacistPerformanceReportTab
            data={pharmacistPerformanceQuery.data?.data}
            isLoading={pharmacistPerformanceQuery.isLoading}
            page={page}
            onPageChange={setPage}
            onResetFilters={handleResetFilters}
          />
        )}

        {activeTab === "returns-exchanges-report" && (
          <ReturnsExchangesReportTab
            data={returnsExchangesQuery.data?.data}
            isLoading={returnsExchangesQuery.isLoading}
            page={page}
            statusFilter={exchangeStatus}
            onStatusFilterChange={setExchangeStatus}
            onPageChange={setPage}
            onResetFilters={handleResetFilters}
          />
        )}
      </div>
    </div>
  );
}
