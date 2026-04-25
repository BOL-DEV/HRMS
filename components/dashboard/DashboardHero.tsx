import React from "react";

type Props = {
  children: React.ReactNode;
  side?: React.ReactNode;
  className?: string;
};

function DashboardHero({ children, side, className }: Props) {
  return (
    <div className={`grid gap-6 xl:grid-cols-[1.35fr_0.9fr] ${className ?? ""}`}>
      <div className="min-w-0">{children}</div>
      {side ? <div className="min-w-0 space-y-6">{side}</div> : null}
    </div>
  );
}

export default DashboardHero;
