"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiSearch,
  FiChevronDown,
  FiCheck,
  FiX,
  FiRotateCcw,
  FiAlertCircle,
  FiSun,
  FiMoon,
  FiPackage,
} from "react-icons/fi";
import { UnitPharmacist } from "@/libs/pharmacy-reports";

export type DatePresetKey =
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "last_30_days"
  | "custom";

export type ShiftKey = "all_day" | "morning" | "afternoon" | "night" | "custom";

interface PharmacyReportsToolbarProps {
  isInventoryTab: boolean;
  // Date states
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  datePreset: DatePresetKey;
  onApplyDatePreset: (preset: DatePresetKey) => void;
  // Time & Shift states
  startTime: string;
  setStartTime: (val: string) => void;
  endTime: string;
  setEndTime: (val: string) => void;
  activeShift: ShiftKey;
  onApplyShiftPreset: (shift: ShiftKey) => void;
  // Pharmacist states
  selectedPharmacist: string;
  onSelectPharmacist: (id: string) => void;
  pharmacists: UnitPharmacist[];
  isPharmacistsLoading: boolean;
  // Search & Reset
  searchInput: string;
  setSearchInput: (val: string) => void;
  searchPlaceholder?: string;
  onResetFilters: () => void;
  // Validation
  isTimeRangeInvalid: boolean;
}

const DATE_PRESETS: { id: DatePresetKey; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "this_week", label: "This Week" },
  { id: "this_month", label: "This Month" },
  { id: "last_30_days", label: "Last 30 Days" },
  { id: "custom", label: "Custom Date Range" },
];

const SHIFT_PRESETS: {
  id: ShiftKey;
  label: string;
  hours: string;
  icon: "sun" | "sunset" | "moon" | "clock";
}[] = [
  { id: "all_day", label: "All Day", hours: "Full Day (00:00 - 23:59)", icon: "clock" },
  { id: "morning", label: "Morning Shift", hours: "08:00 - 14:00", icon: "sun" },
  { id: "afternoon", label: "Afternoon Shift", hours: "14:00 - 20:00", icon: "sunset" },
  { id: "night", label: "Night Shift", hours: "20:00 - 08:00", icon: "moon" },
  { id: "custom", label: "Custom Hours", hours: "Specify exact time", icon: "clock" },
];

export default function PharmacyReportsToolbar({
  isInventoryTab,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  datePreset,
  onApplyDatePreset,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  activeShift,
  onApplyShiftPreset,
  selectedPharmacist,
  onSelectPharmacist,
  pharmacists,
  isPharmacistsLoading,
  searchInput,
  setSearchInput,
  searchPlaceholder = "Search medication, generic, patient, or code...",
  onResetFilters,
  isTimeRangeInvalid,
}: PharmacyReportsToolbarProps) {
  // Dropdown open states
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [isPharmacistOpen, setIsPharmacistOpen] = useState(false);

  // Pharmacist search query inside dropdown
  const [pharmacistSearch, setPharmacistSearch] = useState("");

  // Refs for click outside
  const periodRef = useRef<HTMLDivElement>(null);
  const shiftRef = useRef<HTMLDivElement>(null);
  const pharmacistRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (periodRef.current && !periodRef.current.contains(target)) {
        setIsPeriodOpen(false);
      }
      if (shiftRef.current && !shiftRef.current.contains(target)) {
        setIsShiftOpen(false);
      }
      if (pharmacistRef.current && !pharmacistRef.current.contains(target)) {
        setIsPharmacistOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered pharmacists list for dropdown
  const filteredPharmacists = useMemo(() => {
    const q = pharmacistSearch.trim().toLowerCase();
    if (!q) return pharmacists;
    return pharmacists.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.unit_name && p.unit_name.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q))
    );
  }, [pharmacists, pharmacistSearch]);

  const selectedPharmacistObj = useMemo(() => {
    if (!selectedPharmacist || selectedPharmacist === "all") return null;
    return pharmacists.find((p) => p.id === selectedPharmacist) || null;
  }, [pharmacists, selectedPharmacist]);

  // Labels for triggers
  const datePresetLabel = useMemo(() => {
    const found = DATE_PRESETS.find((p) => p.id === datePreset);
    return found ? found.label : "Custom Range";
  }, [datePreset]);

  const shiftPresetLabel = useMemo(() => {
    if (activeShift === "custom") {
      if (startTime || endTime) {
        return `Custom (${startTime || "00:00"} - ${endTime || "23:59"})`;
      }
      return "Custom Hours";
    }
    const found = SHIFT_PRESETS.find((s) => s.id === activeShift);
    return found ? found.label : "All Day (24h)";
  }, [activeShift, startTime, endTime]);

  // If on inventory or expiry tab, show a simplified snapshot toolbar
  if (isInventoryTab) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <FiPackage className="text-xs" />
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Live Real-Time Inventory Snapshots & Stock Valuation
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">Auto-updated on formulation balance changes</span>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-950"
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
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-500 dark:text-slate-400 dark:hover:text-brand-400 transition"
          >
            <FiRotateCcw />
            Reset Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
      {/* Primary Filter Controls Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Date Preset Selector Dropdown */}
        <div className="relative" ref={periodRef}>
          <button
            type="button"
            onClick={() => {
              setIsPeriodOpen((prev) => !prev);
              setIsShiftOpen(false);
              setIsPharmacistOpen(false);
            }}
            className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-left text-xs transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:bg-slate-800"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <FiCalendar className="text-xs" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">
                  Period Preset
                </p>
                <p className="font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                  {datePresetLabel}
                </p>
              </div>
            </div>
            <FiChevronDown
              className={`text-slate-400 transition-transform shrink-0 ml-1.5 ${
                isPeriodOpen ? "rotate-180 text-brand-500" : ""
              }`}
            />
          </button>

          {isPeriodOpen && (
            <div className="absolute left-0 top-full z-40 mt-1.5 w-60 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="space-y-0.5">
                {DATE_PRESETS.map((p) => {
                  const isSelected = datePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onApplyDatePreset(p.id);
                        setIsPeriodOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                        isSelected
                          ? "bg-brand-50 font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{p.label}</span>
                      {isSelected && <FiCheck className="text-brand-600 dark:text-brand-400 text-sm" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Custom Date Pickers (From → To) */}
        <div className="flex items-center justify-between gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex-1 min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">
              From
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                onApplyDatePreset("custom");
              }}
              className="w-full bg-transparent font-semibold text-slate-900 dark:text-slate-100 focus:outline-none text-xs mt-0.5"
            />
          </div>
          <span className="text-slate-300 dark:text-slate-700 font-bold px-1">→</span>
          <div className="flex-1 min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">
              To
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                onApplyDatePreset("custom");
              }}
              className="w-full bg-transparent font-semibold text-slate-900 dark:text-slate-100 focus:outline-none text-xs mt-0.5"
            />
          </div>
        </div>

        {/* 3. Shift / Operating Hours Dropdown */}
        <div className="relative" ref={shiftRef}>
          <button
            type="button"
            onClick={() => {
              setIsShiftOpen((prev) => !prev);
              setIsPeriodOpen(false);
              setIsPharmacistOpen(false);
            }}
            className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-left text-xs transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:bg-slate-800"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                {activeShift === "morning" ? (
                  <FiSun className="text-xs text-amber-500" />
                ) : activeShift === "afternoon" ? (
                  <FiSun className="text-xs text-orange-500" />
                ) : activeShift === "night" ? (
                  <FiMoon className="text-xs text-indigo-400" />
                ) : (
                  <FiClock className="text-xs" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">
                  Shift / Hours
                </p>
                <p className="font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                  {shiftPresetLabel}
                </p>
              </div>
            </div>
            <FiChevronDown
              className={`text-slate-400 transition-transform shrink-0 ml-1.5 ${
                isShiftOpen ? "rotate-180 text-brand-500" : ""
              }`}
            />
          </button>

          {isShiftOpen && (
            <div className="absolute left-0 top-full z-40 mt-1.5 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="space-y-1">
                {SHIFT_PRESETS.map((s) => {
                  const isSelected = activeShift === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        onApplyShiftPreset(s.id);
                        if (s.id !== "custom") {
                          setIsShiftOpen(false);
                        }
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                        isSelected
                          ? "bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{s.label}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{s.hours}</p>
                      </div>
                      {isSelected && <FiCheck className="text-indigo-600 dark:text-indigo-400 text-sm" />}
                    </button>
                  );
                })}

                {/* Inline custom time inputs inside dropdown */}
                {activeShift === "custom" && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 px-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Specify Exact Hours:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Start:</label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">End:</label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setIsShiftOpen(false)}
                        className="rounded-lg bg-indigo-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-indigo-500 transition"
                      >
                        Apply Hours
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. Pharmacist Custom Dropdown (100% visible high contrast in dark/light mode) */}
        <div className="relative" ref={pharmacistRef}>
          <button
            type="button"
            onClick={() => {
              setIsPharmacistOpen((prev) => !prev);
              setIsPeriodOpen(false);
              setIsShiftOpen(false);
            }}
            className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-left text-xs transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:bg-slate-800"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <FiUser className="text-xs" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">
                  Pharmacist
                </p>
                <p className="font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                  {selectedPharmacistObj ? selectedPharmacistObj.name : "All Pharmacists"}
                </p>
              </div>
            </div>
            <FiChevronDown
              className={`text-slate-400 transition-transform shrink-0 ml-1.5 ${
                isPharmacistOpen ? "rotate-180 text-brand-500" : ""
              }`}
            />
          </button>

          {isPharmacistOpen && (
            <div className="absolute right-0 top-full z-40 mt-1.5 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              {/* Internal search filter for pharmacists */}
              {pharmacists.length > 3 && (
                <div className="relative mb-2 px-1">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    value={pharmacistSearch}
                    onChange={(e) => setPharmacistSearch(e.target.value)}
                    placeholder="Search pharmacist name..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                  {pharmacistSearch && (
                    <button
                      type="button"
                      onClick={() => setPharmacistSearch("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              <div className="max-h-60 overflow-y-auto space-y-0.5 scrollbar-thin">
                {/* All Pharmacists Option */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectPharmacist("all");
                    setIsPharmacistOpen(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                    selectedPharmacist === "all"
                      ? "bg-emerald-50 font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    All Pharmacists (Unit-wide)
                  </span>
                  {selectedPharmacist === "all" && (
                    <FiCheck className="text-emerald-600 dark:text-emerald-400 text-sm shrink-0" />
                  )}
                </button>

                {isPharmacistsLoading && pharmacists.length === 0 && (
                  <p className="px-3 py-3 text-center text-xs text-slate-400">Loading pharmacists...</p>
                )}

                {filteredPharmacists.length === 0 && !isPharmacistsLoading && (
                  <p className="px-3 py-3 text-center text-xs text-slate-400">No matching pharmacists found.</p>
                )}

                {filteredPharmacists.map((p) => {
                  const isSelected = selectedPharmacist === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onSelectPharmacist(p.id);
                        setIsPharmacistOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                        isSelected
                          ? "bg-emerald-50 font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {p.name}
                        </p>
                        {p.unit_name && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {p.unit_name}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <FiCheck className="text-emerald-600 dark:text-emerald-400 text-sm shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validation Alert */}
      {isTimeRangeInvalid && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
          <FiAlertCircle className="text-sm shrink-0" />
          <span>
            Start date/time cannot be later than end date/time. Please adjust your date or operating hours.
          </span>
        </div>
      )}

      {/* Active Filter Badges */}
      {(selectedPharmacist !== "all" || startTime || endTime || datePreset === "custom") && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Active Filters:
          </span>

          {selectedPharmacist !== "all" && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/40 dark:text-emerald-300">
              <FiUser className="text-xs" />
              Pharmacist: {selectedPharmacistObj?.name || "Selected"}
              <button
                type="button"
                onClick={() => onSelectPharmacist("all")}
                className="hover:text-emerald-950 dark:hover:text-white"
                title="Remove pharmacist filter"
              >
                ✕
              </button>
            </span>
          )}

          {(startTime || endTime) && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/40 dark:border-indigo-900/40 dark:text-indigo-300">
              <FiClock className="text-xs" />
              Shift: {startTime || "00:00"} – {endTime || "23:59"}
              <button
                type="button"
                onClick={() => onApplyShiftPreset("all_day")}
                className="hover:text-indigo-950 dark:hover:text-white"
                title="Reset to all day"
              >
                ✕
              </button>
            </span>
          )}

          {datePreset === "custom" && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
              <FiCalendar className="text-xs" />
              Custom: {startDate} to {endDate}
              <button
                type="button"
                onClick={() => onApplyDatePreset("today")}
                className="hover:text-slate-900 dark:hover:text-white"
                title="Reset to today"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}

      {/* Search Input & Reset Action Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 shadow-2xs focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-slate-950"
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
          onClick={onResetFilters}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-500 dark:text-slate-400 dark:hover:text-brand-400 transition"
        >
          <FiRotateCcw />
          Reset All Filters
        </button>
      </div>
    </div>
  );
}
