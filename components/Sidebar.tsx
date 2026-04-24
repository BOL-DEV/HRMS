"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { FiChevronDown, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import ThemeToggle from "./ThemeToggle";

interface Props {
  title: string;
  links: {
    name: string;
    link: string;
    label: React.ReactNode;
    active?: boolean;
    children?: {
      name: string;
      link: string;
      active?: boolean;
    }[];
  }[];
  isOpen?: boolean;
}

const SIDEBAR_PREF_KEY = "swiftrev.sidebar.desktop-pinned";
const SIDEBAR_PREF_EVENT = "swiftrev-sidebar-pref-change";

function getDesktopSidebarPinnedSnapshot() {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.localStorage.getItem(SIDEBAR_PREF_KEY) !== "collapsed";
  } catch {
    return true;
  }
}

function subscribeToDesktopSidebarPreference(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === SIDEBAR_PREF_KEY) {
      onStoreChange();
    }
  };

  const handlePreferenceChange = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SIDEBAR_PREF_EVENT, handlePreferenceChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SIDEBAR_PREF_EVENT, handlePreferenceChange);
  };
}

function Sidebar({ title, links, isOpen = false }: Props) {
  const [isDesktopHovered, setIsDesktopHovered] = useState(false);
  const [openGroups, setOpenGroups] = useState<
    Record<string, boolean | undefined>
  >({});
  const isDesktopPinned = useSyncExternalStore(
    subscribeToDesktopSidebarPreference,
    getDesktopSidebarPinnedSnapshot,
    () => true,
  );

  const isDesktopExpanded = useMemo(
    () => isDesktopPinned || isDesktopHovered,
    [isDesktopHovered, isDesktopPinned],
  );

  const handleDesktopToggle = () => {
    const nextPinned = !isDesktopPinned;

    try {
      window.localStorage.setItem(
        SIDEBAR_PREF_KEY,
        nextPinned ? "pinned" : "collapsed",
      );
      window.dispatchEvent(new Event(SIDEBAR_PREF_EVENT));
    } catch {
      // ignore
    }
  };

  const mobileState = isOpen ? "translate-x-0" : "-translate-x-full";
  const desktopRailWidthClass =
    isDesktopExpanded ? "md:w-64" : "md:w-20";

  return (
    <div
      onMouseEnter={() => setIsDesktopHovered(true)}
      onMouseLeave={() => setIsDesktopHovered(false)}
      className={`fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-200 ease-out ${mobileState} ${desktopRailWidthClass} md:sticky md:top-0 md:h-screen md:translate-x-0`}
    >
      <aside
        className={`h-full w-64 border-r border-gray-200 bg-white shadow-sm transition-[width] duration-150 ease-out dark:border-slate-800 dark:bg-slate-950 md:w-full md:overflow-x-hidden md:overflow-y-auto ${
          isDesktopPinned || isDesktopHovered ? "md:shadow-sm" : "md:shadow-none"
        }`}
      >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 p-5 dark:border-slate-800">
          <div className="relative min-w-0 flex-1 overflow-hidden">
            <h1
              className={`whitespace-nowrap text-xl font-bold text-gray-900 transition-all duration-150 ease-out dark:text-slate-100 ${
                isDesktopExpanded
                  ? "opacity-100 translate-x-0"
                  : "md:-translate-x-2 md:opacity-0"
              }`}
            >
              {title}
            </h1>
            <div
              className={`pointer-events-none absolute text-xl font-bold text-gray-900 transition-all duration-150 ease-out dark:text-slate-100 ${
                isDesktopExpanded
                  ? "md:-translate-x-2 md:opacity-0"
                  : "hidden md:block md:translate-x-0 md:opacity-100"
              }`}
            >
              {title.charAt(0)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleDesktopToggle}
            className="hidden rounded-lg border border-gray-200 bg-gray-50 p-2 text-gray-700 transition hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 md:inline-flex"
            aria-label={
              isDesktopPinned ? "Collapse sidebar" : "Pin sidebar open"
            }
            title={isDesktopPinned ? "Collapse sidebar" : "Pin sidebar open"}
          >
            {isDesktopPinned ? <FiChevronsLeft /> : <FiChevronsRight />}
          </button>
        </div>

        <ul
          className={`flex flex-col gap-2 pt-6 ${
            isDesktopExpanded ? "p-2" : "px-4 py-6 md:px-0"
          }`}
        >
          {links.map((link) => (
            <li
              key={link.name}
              className={!isDesktopExpanded ? "md:flex md:justify-center" : undefined}
            >
              <div className={isDesktopExpanded ? "w-full" : undefined}>
                {link.children?.length ? (
                  (() => {
                    const isGroupOpen = link.active
                      ? openGroups[link.name] !== false
                      : openGroups[link.name] === true;

                    return (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenGroups((prev) => ({
                        ...prev,
                        [link.name]: link.active
                          ? prev[link.name] === false
                            ? undefined
                            : false
                          : prev[link.name] === true
                            ? undefined
                            : true,
                      }))
                    }
                    className={`flex w-full items-center rounded-xl font-medium transition ${
                      link.active
                        ? "bg-blue-800 text-white hover:bg-blue-700"
                        : "text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    } ${
                      isDesktopExpanded
                        ? "justify-start gap-3 p-4"
                        : "justify-center p-4 md:mx-auto md:h-12 md:w-12 md:p-0"
                    }`}
                    title={!isDesktopExpanded ? link.name : undefined}
                    aria-expanded={isGroupOpen}
                    aria-controls={`sidebar-group-${link.name}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center text-xl leading-none">
                      {link.label}
                    </span>
                    <span
                      className={`overflow-hidden whitespace-nowrap transition-all duration-150 ease-out ${
                        isDesktopExpanded
                          ? "max-w-40 opacity-100 translate-x-0"
                          : "max-w-0 md:-translate-x-2 md:opacity-0"
                      }`}
                    >
                      {link.name}
                    </span>
                    {isDesktopExpanded ? (
                      <FiChevronDown
                        className={`ml-auto text-base transition-transform ${
                          isGroupOpen ? "rotate-180" : ""
                        }`}
                      />
                    ) : null}
                  </button>
                    );
                  })()
                ) : (
                  <Link
                    href={link.link}
                    className={`flex items-center rounded-xl font-medium transition ${
                      link.active
                        ? "bg-blue-800 text-white hover:bg-blue-700"
                        : "text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    } ${
                      isDesktopExpanded
                        ? "justify-start gap-3 p-4"
                        : "justify-center p-4 md:mx-auto md:h-12 md:w-12 md:p-0"
                    }`}
                    title={!isDesktopExpanded ? link.name : undefined}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center text-xl leading-none">
                      {link.label}
                    </span>
                    <span
                      className={`overflow-hidden whitespace-nowrap transition-all duration-150 ease-out ${
                        isDesktopExpanded
                          ? "max-w-40 opacity-100 translate-x-0"
                          : "max-w-0 md:-translate-x-2 md:opacity-0"
                      }`}
                    >
                      {link.name}
                    </span>
                  </Link>
                )}

                {(() => {
                  if (!isDesktopExpanded || !link.children?.length) {
                    return null;
                  }

                  const isGroupOpen = link.active
                    ? openGroups[link.name] !== false
                    : openGroups[link.name] === true;

                  return isGroupOpen ? (
                  <ul
                    id={`sidebar-group-${link.name}`}
                    className="mt-2 space-y-1 pl-11"
                  >
                    {link.children.map((child) => (
                      <li key={child.link}>
                        <Link
                          href={child.link}
                          className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                            child.active
                              ? "bg-blue-50 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200"
                              : "text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  ) : null;
                })()}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-auto border-t border-gray-200 p-4 dark:border-slate-800">
          <div
            className={`flex items-center ${isDesktopExpanded ? "justify-between" : "justify-center"}`}
          >
            <span
              className={`overflow-hidden whitespace-nowrap text-sm font-medium text-gray-700 transition-all duration-150 ease-out dark:text-slate-300 ${
                isDesktopExpanded
                  ? "max-w-20 opacity-100 translate-x-0"
                  : "max-w-0 md:-translate-x-2 md:opacity-0"
              }`}
            >
              Theme
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>
      </aside>
    </div>
  );
}

export default Sidebar;
