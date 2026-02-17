import React from "react";

interface Props {
  title: string;
  value: string;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
}

function StatCard({ title, value, delta, deltaTone = "neutral", icon }: Props) {
  const deltaClassName =
    deltaTone === "positive"
      ? "text-blue-600"
      : deltaTone === "negative"
        ? "text-red-600"
        : "text-gray-500";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        <h2 className="text-3xl font-bold mt-2">{value}</h2>
        {delta ? <p className={`text-sm font-medium mt-2 ${deltaClassName}`}>{delta}</p> : null}
      </div>

      <div className="p-3 bg-blue-100 rounded-xl text-blue-600">{icon}</div>
    </div>
  );
}

export default StatCard;
