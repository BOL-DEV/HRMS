"use client";

import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import StatusPill from "@/components/StatusPill";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import {
    FiActivity,
    FiDollarSign,
    FiMoreVertical,
    FiSearch,
    FiSlash,
} from "react-icons/fi";
import { LuHospital } from "react-icons/lu";

type HospitalStatus = "Active" | "Suspended";

type HospitalRow = {
    id: string;
    name: string;
    hospitalId: string;
    email: string;
    phone: string;
    agents: number;
    patients: number;
    revenue: number;
    status: HospitalStatus;
    createdAt: string;
};

const usd = (value: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
    }).format(value);

const usdCompact = (value: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 2,
    }).format(value);

const hospitalsSeed: HospitalRow[] = [
    {
        id: "h1",
        name: "Metropolitan Hospital Center",
        hospitalId: "HC-001",
        email: "admin@metropolitan.com",
        phone: "+1 (555) 123-4567",
        agents: 45,
        patients: 8920,
        revenue: 385000,
        status: "Active",
        createdAt: "2024-06-18",
    },
    {
        id: "h2",
        name: "City Medical Complex",
        hospitalId: "HC-002",
        email: "contact@citymedical.com",
        phone: "+1 (555) 234-5678",
        agents: 38,
        patients: 7240,
        revenue: 320000,
        status: "Active",
        createdAt: "2024-05-10",
    },
    {
        id: "h3",
        name: "Riverside Healthcare",
        hospitalId: "HC-003",
        email: "info@riverside.com",
        phone: "+1 (555) 345-6789",
        agents: 32,
        patients: 5680,
        revenue: 285000,
        status: "Active",
        createdAt: "2024-04-21",
    },
    {
        id: "h4",
        name: "Sunset Medical Center",
        hospitalId: "HC-004",
        email: "admin@sunsetmedical.com",
        phone: "+1 (555) 456-7890",
        agents: 28,
        patients: 4920,
        revenue: 245000,
        status: "Active",
        createdAt: "2024-03-13",
    },
    {
        id: "h5",
        name: "Northside General Hospital",
        hospitalId: "HC-005",
        email: "contact@northside.com",
        phone: "+1 (555) 567-8901",
        agents: 24,
        patients: 3850,
        revenue: 210000,
        status: "Active",
        createdAt: "2024-02-20",
    },
    {
        id: "h6",
        name: "Eastside Wellness Center",
        hospitalId: "HC-006",
        email: "admin@eastside.com",
        phone: "+1 (555) 678-9012",
        agents: 18,
        patients: 2100,
        revenue: 156000,
        status: "Suspended",
        createdAt: "2024-02-02",
    },
    {
        id: "h7",
        name: "Westview Medical",
        hospitalId: "HC-007",
        email: "info@westview.com",
        phone: "+1 (555) 789-0123",
        agents: 22,
        patients: 3450,
        revenue: 189000,
        status: "Active",
        createdAt: "2024-01-18",
    },
    {
        id: "h8",
        name: "Central Health Systems",
        hospitalId: "HC-008",
        email: "contact@centralhealth.com",
        phone: "+1 (555) 890-1234",
        agents: 35,
        patients: 6200,
        revenue: 298000,
        status: "Active",
        createdAt: "2023-12-28",
    },
];

type StatusFilter = "All" | HospitalStatus;
type SortBy = "Newest" | "Oldest";

function Page() {
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
    const [sortBy, setSortBy] = useState<SortBy>("Newest");

    const totals = useMemo(() => {
        const total = hospitalsSeed.length;
        const active = hospitalsSeed.filter((h) => h.status === "Active").length;
        const suspended = hospitalsSeed.filter(
            (h) => h.status === "Suspended",
        ).length;
        const revenue = hospitalsSeed.reduce((sum, h) => sum + h.revenue, 0);
        return { total, active, suspended, revenue };
    }, []);

    const rows = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        const filtered = hospitalsSeed.filter((h) => {
            const matchesQuery =
                !normalizedQuery ||
                h.name.toLowerCase().includes(normalizedQuery) ||
                h.hospitalId.toLowerCase().includes(normalizedQuery);

            const matchesStatus =
                statusFilter === "All" ? true : h.status === statusFilter;

            return matchesQuery && matchesStatus;
        });

        const byDate = (a: HospitalRow, b: HospitalRow) => {
            const aTime = new Date(a.createdAt).getTime();
            const bTime = new Date(b.createdAt).getTime();
            return sortBy === "Newest" ? bTime - aTime : aTime - bTime;
        };

        return [...filtered].sort(byDate);
    }, [query, sortBy, statusFilter]);

    const stats = useMemo(
        () => [
            {
                title: "Total Hospitals",
                value: totals.total.toString(),
                icon: <LuHospital className="text-xl" />,
            },
            {
                title: "Active Hospitals",
                value: totals.active.toString(),
                icon: <FiActivity className="text-xl" />,
            },
            {
                title: "Suspended Hospitals",
                value: totals.suspended.toString(),
                icon: <FiSlash className="text-xl" />,
            },
            {
                title: "Total Platform Revenue",
                value: usdCompact(totals.revenue),
                icon: <FiDollarSign className="text-xl" />,
            },
        ],
        [totals],
    );

    return (
        <div className="w-full bg-gray-50 min-h-screen">
            <Header
                title="Hospitals"
                Subtitle="Manage registered hospitals on the platform"
                actions={
                    <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium">
                        Add Hospital
                    </button>
                }
            />

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {stats.map((s) => (
                        <StatCard
                            key={s.title}
                            title={s.title}
                            value={s.value}
                            icon={s.icon}
                        />
                    ))}
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search hospital name or ID"
                            className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm"
                        />
                    </div>

                    <div className="flex gap-3 md:justify-end">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium"
                            aria-label="Filter by status"
                        >
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Suspended">Suspended</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortBy)}
                            className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium"
                            aria-label="Sort hospitals"
                        >
                            <option value="Newest">Newest</option>
                            <option value="Oldest">Oldest</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-gray-200">
                        <h2 className="text-xl font-bold">Hospitals List</h2>
                        <p className="text-sm text-gray-600">{rows.length} hospitals found</p>
                    </div>

                    <div className="p-5 overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-600 bg-gray-100">
                                    <th className="p-3 font-semibold">Hospital Name</th>
                                    <th className="p-3 font-semibold">Hospital ID</th>
                                    <th className="p-3 font-semibold">Email</th>
                                    <th className="p-3 font-semibold">Phone</th>
                                    <th className="p-3 font-semibold">Agents</th>
                                    <th className="p-3 font-semibold">Patients</th>
                                    <th className="p-3 font-semibold">Revenue</th>
                                    <th className="p-3 font-semibold">Status</th>
                                    <th className="p-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((h) => (
                                    <tr key={h.id} className="border-b border-gray-100">
                                        <td className="p-3 font-semibold text-gray-900 whitespace-nowrap">
                                            <Link
                                                href={`/admin/hospitals/${h.id}`}
                                                className="hover:underline"
                                            >
                                                {h.name}
                                            </Link>
                                        </td>
                                        <td className="p-3 text-gray-700 whitespace-nowrap">{h.hospitalId}</td>
                                        <td className="p-3 text-gray-700 whitespace-nowrap">{h.email}</td>
                                        <td className="p-3 text-gray-700 whitespace-nowrap">{h.phone}</td>
                                        <td className="p-3 text-gray-700">{h.agents}</td>
                                        <td className="p-3 text-gray-700">{h.patients.toLocaleString("en-US")}</td>
                                        <td className="p-3 text-blue-700 font-semibold whitespace-nowrap">
                                            {usd(h.revenue)}
                                        </td>
                                        <td className="p-3">
                                            <StatusPill status={h.status} />
                                        </td>
                                        <td className="p-3 text-right">
                                            <Link
                                                href={`/admin/hospitals/${h.id}`}
                                                className="p-2 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200"
                                                aria-label="View hospital"
                                            >
                                                <FiMoreVertical className="text-gray-700" />
                                            </Link>
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
