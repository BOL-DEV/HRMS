import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

function DashboardKpiGrid({ children, className }: Props) {
  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export default DashboardKpiGrid;
