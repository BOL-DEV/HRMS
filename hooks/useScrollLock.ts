"use client";

import { useEffect } from "react";

let activeModalsCount = 0;
let originalBodyOverflow = "";
let originalBodyPaddingRight = "";

/**
 * Custom hook to lock body scrolling when a modal or dialog is visible.
 * Supports multiple nested or simultaneous modals safely via reference counting.
 */
export function useScrollLock(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked || typeof document === "undefined") return;

    if (activeModalsCount === 0) {
      originalBodyOverflow = document.body.style.overflow;
      originalBodyPaddingRight = document.body.style.paddingRight;

      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
    }

    activeModalsCount++;

    return () => {
      activeModalsCount = Math.max(0, activeModalsCount - 1);
      if (activeModalsCount === 0) {
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.paddingRight = originalBodyPaddingRight;
      }
    };
  }, [isLocked]);
}
