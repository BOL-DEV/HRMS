"use client";

import React, { useEffect, useRef } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  align?: "center" | "right" | "left";
}

export default function Modal({
  isOpen,
  onClose,
  children,
  className = "",
  overlayClassName = "bg-slate-950/60 backdrop-blur-xs",
  closeOnOutsideClick = true,
  closeOnEscape = true,
  align = "center",
}: ModalProps) {
  useScrollLock(isOpen);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const alignStyles = {
    center: "items-center justify-center p-4",
    right: "items-start justify-end",
    left: "items-start justify-start",
  }[align];

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (closeOnOutsideClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
      className={`fixed inset-0 z-50 flex overflow-y-auto ${alignStyles} ${overlayClassName} animate-in fade-in duration-150`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
