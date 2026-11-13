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
  getUnitPharmacists,
  UnitPharmacist,
} from "@/libs/pharmacy-reports";
import DrugSalesReportTab from "@/components/pharmacy/reports/DrugSalesReportTab";
import DetailedDispenseReportTab from "@/components/pharmacy/reports/DetailedDispenseReportTab";
import StockInventoryReportTab from "@/components/pharmacy/reports/StockInventoryReportTab";
import ExpiryAlertsReportTab from "@/components/pharmacy/reports/ExpiryAlertsReportTab";
import PharmacistPerformanceReportTab from "@/components/pharmacy/reports/PharmacistPerformanceReportTab";
import ReturnsExchangesReportTab from "@/components/pharmacy/reports/ReturnsExchangesReportTab";
import PharmacyReportsToolbar, {
  DatePresetKey,
  ShiftKey,
} from "@/components/pharmacy/reports/PharmacyReportsToolbar";
import {
  FiTrendingUp,
  FiFileText,
  FiPackage,
  FiClock,
  FiUsers,
  FiRepeat,
  FiPrinter,
  FiDownload,
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
  const jwtModules = decoded?.modules || decoded?.user?.modules || decoded?.data?.modules;
  const userModules: string[] = userProfile?.modules || (Array.isArray(jwtModules) ? jwtModules : []);
  const isPlatformAdmin = userRole === "PLATFORM_ADMIN";
  const isStoreManager = userRole === "PHARMACY_STORE";

  // Filter accessible tabs
  const allowedTabs = useMemo(() => {
    return ALL_REPORT_TABS.filter((tab) => {
      if (isPlatformAdmin) return true;
      if (isStoreManager) {
        return tab.roles.includes("PHARMACY_STORE");
      }
      // If user has general reports module or standard pharmacy access, allow all retail pharmacy tabs
      if (
        userModules.includes("reports") ||
        userModules.length === 0 ||
        userModules.length <= 8 ||
        userModules.includes(tab.module) ||
        tab.roles.includes("PHARMACY")
      ) {
        return tab.roles.includes("PHARMACY");
      }
      return false;
    });
  }, [isPlatformAdmin, isStoreManager, userModules, userRole]);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<ReportTabKey>("drug-report");

  // Auto-switch to first allowed tab if current active tab is not accessible
  useEffect(() => {
    if (allowedTabs.length > 0 && !allowedTabs.some((t) => t.key === activeTab)) {
      setActiveTab(allowedTabs[0].key);
    }
  }, [allowedTabs, activeTab]);

function formatLocalYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

  // Date Presets Helper (Local time default)
  const todayStr = useMemo(() => {
    return formatLocalYMD(new Date());
  }, []);

  const [datePreset, setDatePreset] = useState<DatePresetKey>("today");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Time & Shift Filter States (Backend Granular Time Filtering)
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [activeShift, setActiveShift] = useState<ShiftKey>("all_day");

  // Pharmacist Filter State (Backend Pharmacist Filtering in Unit)
  const [selectedPharmacist, setSelectedPharmacist] = useState("all");

  // Fetch Pharmacists in Unit for dropdown
  const pharmacistsQuery = useQuery({
    queryKey: ["pharmacy-unit-pharmacists"],
    queryFn: () => getUnitPharmacists(),
    enabled: Boolean(accessToken),
    staleTime: 5 * 60 * 1000,
  });

  const pharmacists: UnitPharmacist[] = useMemo(() => {
    const res = pharmacistsQuery.data;
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray((res as any).data)) return (res as any).data;
    return [];
  }, [pharmacistsQuery.data]);

  const selectedPharmacistObj = useMemo(() => {
    if (!selectedPharmacist || selectedPharmacist === "all") return null;
    return pharmacists.find((p) => p.id === selectedPharmacist) || null;
  }, [pharmacists, selectedPharmacist]);

  // Validate start vs end date/time to prevent invalid 400 Bad Request queries
  const isTimeRangeInvalid = useMemo(() => {
    if (!startDate || !endDate) return false;
    if (startDate > endDate) return true;
    if (startDate === endDate && startTime && endTime && startTime > endTime) return true;
    return false;
  }, [startDate, endDate, startTime, endTime]);

  const applyDatePreset = (preset: DatePresetKey) => {
    setDatePreset(preset);
    if (preset === "custom") return;
    setActiveShift("all_day");
    setStartTime("");
    setEndTime("");
    const now = new Date();

    if (preset === "today") {
      const today = formatLocalYMD(now);
      setStartDate(today);
      setEndDate(today);
    } else if (preset === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = formatLocalYMD(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === "this_week") {
      const start = new Date(now);
      const day = start.getDay(); // 0 is Sunday
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start.setDate(diff);
      setStartDate(formatLocalYMD(start));
      setEndDate(formatLocalYMD(now));
    } else if (preset === "this_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatLocalYMD(start));
      setEndDate(formatLocalYMD(now));
    } else if (preset === "last_30_days") {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      setStartDate(formatLocalYMD(start));
      setEndDate(formatLocalYMD(now));
    }
  };

  const applyShiftPreset = (shift: ShiftKey) => {
    setActiveShift(shift);
    if (shift === "custom") return;
    if (shift === "all_day") {
      setStartTime("");
      setEndTime("");
    } else if (shift === "morning") {
      setStartTime("08:00");
      setEndTime("14:00");
    } else if (shift === "afternoon") {
      setStartTime("14:00");
      setEndTime("20:00");
    } else if (shift === "night") {
      setStartTime("20:00");
      setEndTime("08:00");
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
  }, [
    activeTab,
    startDate,
    endDate,
    startTime,
    endTime,
    selectedPharmacist,
    debouncedSearch,
    stockStatus,
    expiryTimeframe,
    exchangeStatus,
  ]);

  // Handle Full Reset
  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStockStatus("all");
    setExpiryTimeframe("all");
    setExchangeStatus("all");
    setSelectedPharmacist("all");
    setActiveShift("all_day");
    setStartTime("");
    setEndTime("");
    applyDatePreset("today");
    setPage(1);
  };

  // Active Tab Configuration
  const currentTabConfig = useMemo(() => {
    return ALL_REPORT_TABS.find((t) => t.key === activeTab) || ALL_REPORT_TABS[0];
  }, [activeTab]);

  // --- Live TanStack Queries ---
  const drugSalesQuery = useQuery({
    queryKey: [
      "pharmacy-report-drug",
      startDate,
      startTime,
      endDate,
      endTime,
      selectedPharmacist,
      debouncedSearch,
    ],
    queryFn: () =>
      getDrugSalesReport({
        start_date: startDate,
        start_time: startTime || undefined,
        end_date: endDate,
        end_time: endTime || undefined,
        pharmacist_id: selectedPharmacist !== "all" ? selectedPharmacist : undefined,
        search: debouncedSearch,
      }),
    enabled: Boolean(accessToken && activeTab === "drug-report" && !isTimeRangeInvalid),
  });

  const detailedDispenseQuery = useQuery({
    queryKey: [
      "pharmacy-report-detailed",
      startDate,
      startTime,
      endDate,
      endTime,
      selectedPharmacist,
      debouncedSearch,
    ],
    queryFn: () =>
      getDetailedDispenseReport({
        start_date: startDate,
        start_time: startTime || undefined,
        end_date: endDate,
        end_time: endTime || undefined,
        pharmacist_id: selectedPharmacist !== "all" ? selectedPharmacist : undefined,
        search: debouncedSearch,
      }),
    enabled: Boolean(accessToken && activeTab === "detailed-drug-report" && !isTimeRangeInvalid),
  });

  const stockInventoryQuery = useQuery({
    queryKey: ["pharmacy-report-stock", stockStatus, debouncedSearch],
    queryFn: () =>
      getStockInventoryReport({
        stock_status: stockStatus,
        search: debouncedSearch,
      }),
    enabled: Boolean(accessToken && activeTab === "stock-inventory-report"),
  });

  const expiryQuery = useQuery({
    queryKey: ["pharmacy-report-expiry", expiryTimeframe, debouncedSearch],
    queryFn: () =>
      getExpiryReport({
        timeframe: expiryTimeframe,
        search: debouncedSearch,
      }),
    enabled: Boolean(accessToken && activeTab === "expiry-report"),
  });

  const pharmacistPerformanceQuery = useQuery({
    queryKey: [
      "pharmacy-report-performance",
      startDate,
      startTime,
      endDate,
      endTime,
      selectedPharmacist,
    ],
    queryFn: () =>
      getPharmacistPerformanceReport({
        start_date: startDate,
        start_time: startTime || undefined,
        end_date: endDate,
        end_time: endTime || undefined,
        pharmacist_id: selectedPharmacist !== "all" ? selectedPharmacist : undefined,
      }),
    enabled: Boolean(accessToken && activeTab === "pharmacist-performance-report" && !isTimeRangeInvalid),
  });

  const returnsExchangesQuery = useQuery({
    queryKey: [
      "pharmacy-report-returns",
      startDate,
      startTime,
      endDate,
      endTime,
      selectedPharmacist,
      exchangeStatus,
      debouncedSearch,
    ],
    queryFn: () =>
      getReturnsExchangesReport({
        start_date: startDate,
        start_time: startTime || undefined,
        end_date: endDate,
        end_time: endTime || undefined,
        pharmacist_id: selectedPharmacist !== "all" ? selectedPharmacist : undefined,
        status: exchangeStatus,
        search: debouncedSearch,
      }),
    enabled: Boolean(accessToken && activeTab === "returns-exchanges-report" && !isTimeRangeInvalid),
  });

  // Active loaded data for print/export fallback
  const activeTabData = useMemo(() => {
    switch (activeTab) {
      case "drug-report":
        return (drugSalesQuery.data as any)?.data ?? drugSalesQuery.data;
      case "detailed-drug-report":
        return (detailedDispenseQuery.data as any)?.data ?? detailedDispenseQuery.data;
      case "stock-inventory-report":
        return (stockInventoryQuery.data as any)?.data ?? stockInventoryQuery.data;
      case "expiry-report":
        return (expiryQuery.data as any)?.data ?? expiryQuery.data;
      case "pharmacist-performance-report":
        return (pharmacistPerformanceQuery.data as any)?.data ?? pharmacistPerformanceQuery.data;
      case "returns-exchanges-report":
        return (returnsExchangesQuery.data as any)?.data ?? returnsExchangesQuery.data;
      default:
        return null;
    }
  }, [
    activeTab,
    drugSalesQuery.data,
    detailedDispenseQuery.data,
    stockInventoryQuery.data,
    expiryQuery.data,
    pharmacistPerformanceQuery.data,
    returnsExchangesQuery.data,
  ]);

  // Export CSV Handler
  const [isExporting, setIsExporting] = useState(false);
  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const filters: Record<string, any> = {
        start_date: startDate,
        start_time: startTime || undefined,
        end_date: endDate,
        end_time: endTime || undefined,
        pharmacist_id: selectedPharmacist !== "all" ? selectedPharmacist : undefined,
        pharmacist_name: selectedPharmacistObj?.name || undefined,
        search: debouncedSearch || undefined,
      };

      if (activeTab === "stock-inventory-report") {
        delete filters.start_date;
        delete filters.start_time;
        delete filters.end_date;
        delete filters.end_time;
        delete filters.pharmacist_id;
        delete filters.pharmacist_name;
        filters.stock_status = stockStatus;
      } else if (activeTab === "expiry-report") {
        delete filters.start_date;
        delete filters.start_time;
        delete filters.end_date;
        delete filters.end_time;
        delete filters.pharmacist_id;
        delete filters.pharmacist_name;
        filters.timeframe = expiryTimeframe;
      } else if (activeTab === "returns-exchanges-report") {
        filters.status = exchangeStatus;
      }

      await downloadPharmacyReportCsv(
        currentTabConfig.endpoint,
        filters,
        currentTabConfig.filePrefix,
        activeTabData,
        currentTabConfig.key
      );
      toast.success("Report downloaded successfully as CSV!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  // Print Handler
  const handlePrint = async () => {
    const filters: Record<string, any> = {
      start_date: startDate,
      start_time: startTime || undefined,
      end_date: endDate,
      end_time: endTime || undefined,
      pharmacist_id: selectedPharmacist !== "all" ? selectedPharmacist : undefined,
      pharmacist_name: selectedPharmacistObj?.name || undefined,
      search: debouncedSearch || undefined,
    };

    if (activeTab === "stock-inventory-report") {
      delete filters.start_date;
      delete filters.start_time;
      delete filters.end_date;
      delete filters.end_time;
      delete filters.pharmacist_id;
      delete filters.pharmacist_name;
      filters.stock_status = stockStatus;
    } else if (activeTab === "expiry-report") {
      delete filters.start_date;
      delete filters.start_time;
      delete filters.end_date;
      delete filters.end_time;
      delete filters.pharmacist_id;
      delete filters.pharmacist_name;
      filters.timeframe = expiryTimeframe;
    } else if (activeTab === "returns-exchanges-report") {
      filters.status = exchangeStatus;
    }

    await openPharmacyReportPrint(
      currentTabConfig.endpoint,
      filters,
      currentTabConfig.label,
      activeTabData,
      currentTabConfig.key
    );
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

        {/* Global Toolbar: Modern Compact Presets, Pharmacist Dropdown, Custom Range, Search */}
        <PharmacyReportsToolbar
          isInventoryTab={activeTab === "stock-inventory-report" || activeTab === "expiry-report"}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          datePreset={datePreset}
          onApplyDatePreset={applyDatePreset}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          activeShift={activeShift}
          onApplyShiftPreset={applyShiftPreset}
          selectedPharmacist={selectedPharmacist}
          onSelectPharmacist={setSelectedPharmacist}
          pharmacists={pharmacists}
          isPharmacistsLoading={pharmacistsQuery.isLoading}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          searchPlaceholder={
            activeTab === "detailed-drug-report"
              ? "Search drug, patient name, PID, phone, or billing code..."
              : activeTab === "expiry-report"
              ? "Search medication name, generic, or batch number..."
              : activeTab === "returns-exchanges-report"
              ? "Search exchange code, patient name, PID, or drug..."
              : "Search medication or generic name..."
          }
          onResetFilters={handleResetFilters}
          isTimeRangeInvalid={isTimeRangeInvalid}
        />

        {/* Tab Content Sub-views */}
        {activeTab === "drug-report" && (
          <DrugSalesReportTab
            data={(drugSalesQuery.data as any)?.data ?? drugSalesQuery.data}
            isLoading={drugSalesQuery.isLoading}
            page={page}
            onPageChange={setPage}
            onResetFilters={handleResetFilters}
          />
        )}

        {activeTab === "detailed-drug-report" && (
          <DetailedDispenseReportTab
            data={(detailedDispenseQuery.data as any)?.data ?? detailedDispenseQuery.data}
            isLoading={detailedDispenseQuery.isLoading}
            page={page}
            onPageChange={setPage}
            onResetFilters={handleResetFilters}
          />
        )}

        {activeTab === "stock-inventory-report" && (
          <StockInventoryReportTab
            data={(stockInventoryQuery.data as any)?.data ?? stockInventoryQuery.data}
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
            data={(expiryQuery.data as any)?.data ?? expiryQuery.data}
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
            data={(pharmacistPerformanceQuery.data as any)?.data ?? pharmacistPerformanceQuery.data}
            isLoading={pharmacistPerformanceQuery.isLoading}
            page={page}
            onPageChange={setPage}
            onResetFilters={handleResetFilters}
          />
        )}

        {activeTab === "returns-exchanges-report" && (
          <ReturnsExchangesReportTab
            data={(returnsExchangesQuery.data as any)?.data ?? returnsExchangesQuery.data}
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
