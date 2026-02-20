"use client";

import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import StatusPill from "@/components/StatusPill";
import { formatCompactNumber, formatUsd } from "@/libs/helper";
import React from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    FiActivity,
    FiDollarSign,
    FiFileText,
    FiUsers,
} from "react-icons/fi";
import { LuHospital } from "react-icons/lu";

type HospitalRow = {
    name: string;
    revenue: number;
    transactions: number;
    agents: number;
    status: "Active" | "Inactive" | "Suspended";
};

const formatCompactUsd = (amount: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 2,
    }).format(amount);

function Page() {
    const kpis = {
        totalHospitals: 47,
        activeHospitals: 43,
        totalPlatformRevenue: 2_850_000,
        totalTransactions: 15_420,
        totalAgents: 328,
        totalPatients: 125_640,
    };

    const stats = [
        {
            title: "Total Hospitals",
            value: formatCompactNumber(kpis.totalHospitals),
            icon: <LuHospital className="text-xl" />,
        },
        {
            title: "Active Hospitals",
            value: formatCompactNumber(kpis.activeHospitals),
            icon: <FiActivity className="text-xl" />,
        },
        {
            title: "Total Platform Revenue",
            value: formatCompactUsd(kpis.totalPlatformRevenue),
            icon: <FiDollarSign className="text-xl" />,
        },
        {
            title: "Total Transactions",
            value: new Intl.NumberFormat("en-US").format(kpis.totalTransactions),
            icon: <FiFileText className="text-xl" />,
        },
        {
            title: "Total Agents",
            value: formatCompactNumber(kpis.totalAgents),
            icon: <FiUsers className="text-xl" />,
        },
        {
            title: "Total Patients",
            value: new Intl.NumberFormat("en-US").format(kpis.totalPatients),
            icon: <FiUsers className="text-xl" />,
        },
    ];

    const monthlyRevenue = [
        { month: "Jan", revenue: 180_000 },
        { month: "Feb", revenue: 220_000 },
        { month: "Mar", revenue: 195_000 },
        { month: "Apr", revenue: 285_000 },
        { month: "May", revenue: 310_000 },
        { month: "Jun", revenue: 360_000 },
    ];

    const paymentMethods = [
        { name: "Credit Card", transactions: 6200 },
        { name: "Insurance", transactions: 5100 },
        { name: "Direct Pay", transactions: 2400 },
        { name: "ACH", transactions: 1700 },
    ];

    const topHospitals: HospitalRow[] = [
        {
            name: "Metropolitan Hospital Center",
            revenue: 385_000,
            transactions: 1240,
            agents: 45,
            status: "Active",
        },
        {
            name: "City Medical Complex",
            revenue: 320_000,
            transactions: 1050,
            agents: 38,
            status: "Active",
        },
        {
            name: "Riverside Healthcare",
            revenue: 285_000,
            transactions: 920,
            agents: 32,
            status: "Active",
        },
        {
            name: "Sunset Medical Center",
            revenue: 245_000,
            transactions: 785,
            agents: 28,
            status: "Active",
        },
        {
            name: "Northside General Hospital",
            revenue: 205_000,
            transactions: 640,
            agents: 21,
            status: "Active",
        },
    ];

    const hospitalGrowth = [
        { month: "Jan", hospitals: 32 },
        { month: "Feb", hospitals: 35 },
        { month: "Mar", hospitals: 37 },
        { month: "Apr", hospitals: 40 },
        { month: "May", hospitals: 44 },
        { month: "Jun", hospitals: 47 },
    ];

    return (
        <div className="w-full bg-gray-50 min-h-screen">
            <Header
                title="Admin Dashboard"
                Subtitle="Platform revenue, hospitals, agents, and transactions"
            />

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {stats.map((item) => (
                        <StatCard
                            key={item.title}
                            title={item.title}
                            value={item.value}
                            icon={item.icon}
                        />
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl">
                        <div className="p-5 border-b border-gray-200">
                            <h2 className="text-xl font-bold">Revenue Trend</h2>
                            <p className="text-sm text-gray-600">
                                Monthly revenue across platform
                            </p>
                        </div>

                        <div className="w-full h-80 p-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyRevenue} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(v) => v.toString()} />
                                    <Tooltip
                                        formatter={(value) => [new Intl.NumberFormat("en-US").format(Number(value)), "revenue"]}
                                        labelFormatter={(label) => `${label}`}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        name="revenue"
                                        stroke="#2563EB"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl">
                        <div className="p-5 border-b border-gray-200">
                            <h2 className="text-xl font-bold">Transactions by Payment Method</h2>
                            <p className="text-sm text-gray-600">
                                Distribution of payment methods
                            </p>
                        </div>

                        <div className="w-full h-80 p-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={paymentMethods} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(v) => v.toString()} />
                                    <Tooltip
                                        formatter={(value) => [new Intl.NumberFormat("en-US").format(Number(value)), "transactions"]}
                                        labelFormatter={(label) => `${label}`}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="transactions"
                                        name="transactions"
                                        fill="#2563EB"
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl">
                        <div className="p-5 border-b border-gray-200">
                            <h2 className="text-xl font-bold">Top Hospitals by Revenue</h2>
                            <p className="text-sm text-gray-600">Highest performing hospitals</p>
                        </div>

                        <div className="w-full h-80 p-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[...topHospitals].reverse().map((h) => ({ name: h.name, revenue: h.revenue }))}
                                    layout="vertical"
                                    margin={{ top: 10, right: 20, left: 30, bottom: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tickFormatter={(v) => v.toString()} />
                                    <YAxis type="category" dataKey="name" width={150} />
                                    <Tooltip formatter={(value) => [formatUsd(Number(value)), "revenue"]} />
                                    <Bar dataKey="revenue" fill="#2563EB" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl">
                        <div className="p-5 border-b border-gray-200">
                            <h2 className="text-xl font-bold">Hospital Growth Trend</h2>
                            <p className="text-sm text-gray-600">New hospitals onboarded</p>
                        </div>

                        <div className="w-full h-80 p-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hospitalGrowth} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(v) => v.toString()} />
                                    <Tooltip formatter={(value) => [new Intl.NumberFormat("en-US").format(Number(value)), "hospitals"]} />
                                    <Legend />
                                    <Bar dataKey="hospitals" name="hospitals" fill="#2563EB" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-gray-200 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold">Top Hospitals</h2>
                            <p className="text-sm text-gray-600">Highest performing hospitals on the platform</p>
                        </div>
                        <button className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium">
                            Export
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-600 bg-gray-100">
                                    <th className="p-3 font-semibold">Hospital Name</th>
                                    <th className="p-3 font-semibold">Revenue</th>
                                    <th className="p-3 font-semibold">Transactions</th>
                                    <th className="p-3 font-semibold">Agents</th>
                                    <th className="p-3 font-semibold">Status</th>
                                    <th className="p-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topHospitals.map((row) => (
                                    <tr key={row.name} className="border-b border-gray-100">
                                        <td className="p-3 font-semibold text-gray-900 whitespace-nowrap">{row.name}</td>
                                        <td className="p-3 text-gray-900 whitespace-nowrap">{formatUsd(row.revenue)}</td>
                                        <td className="p-3 text-gray-700">{new Intl.NumberFormat("en-US").format(row.transactions)}</td>
                                        <td className="p-3 text-gray-700">{row.agents}</td>
                                        <td className="p-3">
                                            <StatusPill status={row.status} />
                                        </td>
                                        <td className="p-3 text-right">
                                            <button className="text-blue-700 font-semibold hover:underline">
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Page;
