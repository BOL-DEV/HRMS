"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatUsd } from "@/libs/helper";
import {
  getHospitalById,
  type HospitalTransactionStatus,
} from "@/libs/hospital";

function StatusTag({ status }: { status: HospitalTransactionStatus }) {
  const className =
    status === "completed"
      ? "bg-green-100 text-green-700"
      : status === "pending"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${className}`}
    >
      {status}
    </span>
  );
}

export default function HospitalOverviewPage() {
	const params = useParams<{ id: string }>();
	const id = params?.id ?? "";
	const hospital = id ? getHospitalById(id) : undefined;

	const stats = useMemo(() => {
		if (!hospital) return [];

		return [
			{
				title: "Total Revenue",
				value: formatUsd(hospital.revenue),
				meta: hospital.revenueDeltaLabel,
				tone: "default" as const,
			},
			{
				title: "Total Transactions",
				value: hospital.transactions.toString(),
				meta: hospital.transactionsLabel,
				tone: "default" as const,
			},
			{
				title: "Total Agents",
				value: hospital.agents.toString(),
				meta: hospital.agentsLabel,
				tone: "default" as const,
			},
			{
				title: "Total Patients",
				value: hospital.patients.toString(),
				meta: hospital.patientsLabel,
				tone: "default" as const,
			},
			{
				title: "Pending Refunds",
				value: hospital.pendingRefunds.toString(),
				meta: hospital.refundsLabel,
				tone: "danger" as const,
			},
		];
	}, [hospital]);

	if (!hospital) {
		return (
			<div className="bg-white border border-gray-200 rounded-xl p-6">
				<h2 className="text-xl font-bold">Hospital not found</h2>
				<p className="text-sm text-gray-600">Check the hospital id in the URL.</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
				{stats.map((s) => (
					<div key={s.title} className="bg-white border border-gray-200 rounded-xl p-5">
						<p className="text-sm text-gray-600 font-medium">{s.title}</p>
						<p
							className={
								s.tone === "danger"
									? "text-3xl font-bold mt-3 text-red-600"
									: "text-3xl font-bold mt-3 text-gray-900"
							}
						>
							{s.value}
						</p>
						{s.meta ? <p className="text-xs text-gray-500 mt-2">{s.meta}</p> : null}
					</div>
				))}
			</div>

			<div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
				<div className="p-5 border-b border-gray-200">
					<h2 className="text-xl font-bold">Revenue Trend</h2>
					<p className="text-sm text-gray-600">Daily revenue for the past 20 days</p>
				</div>

				<div className="h-96 p-6">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={hospital.revenueTrend} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="date" />
							<YAxis tickFormatter={(v) => String(v)} />
							<Tooltip formatter={(value) => [formatUsd(Number(value)), "revenue"]} />
							<Line type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} />
						</LineChart>
					</ResponsiveContainer>
				</div>
			</div>

			<div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
				<div className="p-5 border-b border-gray-200">
					<h2 className="text-xl font-bold">Recent Transactions</h2>
					<p className="text-sm text-gray-600">Latest transactions from this hospital</p>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="text-left text-gray-600">
							<tr className="border-b border-gray-200">
								<th className="p-4 font-semibold">Transaction ID</th>
								<th className="p-4 font-semibold">Patient</th>
								<th className="p-4 font-semibold">Amount</th>
								<th className="p-4 font-semibold">Payment Method</th>
								<th className="p-4 font-semibold">Status</th>
								<th className="p-4 font-semibold">Date</th>
							</tr>
						</thead>
						<tbody>
							{hospital.recentTransactions.length ? (
								hospital.recentTransactions.map((t) => (
									<tr key={t.id} className="border-b border-gray-100 last:border-0">
										<td className="p-4 font-medium text-gray-900">{t.id}</td>
										<td className="p-4 text-gray-700">{t.patient}</td>
										<td className="p-4 font-medium text-gray-900">{formatUsd(t.amount)}</td>
										<td className="p-4 text-gray-700">{t.paymentMethod}</td>
										<td className="p-4">
											<StatusTag status={t.status} />
										</td>
										<td className="p-4 text-gray-700">{t.date}</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={6} className="p-8 text-center text-gray-500">
										No recent transactions
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

