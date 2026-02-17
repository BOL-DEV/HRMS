"use client";

import Header from "@/components/Header";
import React, { useState } from "react";
import {
  FiEdit,
  FiMail,
  FiBell,
  FiSmartphone,
  FiSun,
  FiMoon,
} from "react-icons/fi";

function Page() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [pageSize, setPageSize] = useState("10 rows per page");
  const [defaultRange, setDefaultRange] = useState("This Month");

  const toggle = (key: "email" | "sms" | "push") => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="h-screen w-full bg-gray-100 overflow-y-auto">
      <Header title="Settings" Subtitle="Manage your account and preferences" />

      <div className="p-6 space-y-6">
        <section className="bg-white border border-gray-200 rounded-xl p-6 flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-2xl">
              <span role="img" aria-label="avatar">
                🙂
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Profile Information</h2>
              <p className="text-sm text-gray-600">
                View and edit your profile details
              </p>
              <div className="mt-4 space-y-1 text-sm text-gray-800">
                <p className="font-semibold">John Doe</p>
                <p>Finance Agent</p>
                <p>ID: AG-001</p>
                <p>john.doe@hospital.com</p>
              </div>
            </div>
          </div>

          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-800 hover:bg-gray-50">
            <FiEdit />
            Edit Profile
          </button>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Change Password</h2>
              <p className="text-sm text-gray-600">
                Update your account password
              </p>
            </div>
            <button className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-800 hover:bg-gray-50">
              Update Password
            </button>
          </div>

          <p className="mt-4 text-sm text-gray-700">
            Keep your account secure by changing your password regularly
          </p>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold">Notification Preferences</h2>
            <p className="text-sm text-gray-600">
              Choose how you want to receive notifications
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {[
              {
                key: "email",
                title: "Email Notifications",
                desc: "Receive updates via email",
                icon: <FiMail />,
              },
              {
                key: "sms",
                title: "SMS Notifications",
                desc: "Receive text message alerts",
                icon: <FiSmartphone />,
              },
              {
                key: "push",
                title: "Push Notifications",
                desc: "Receive browser notifications",
                icon: <FiBell />,
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between py-4"
              >
                <div>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="text-gray-600">{item.icon}</span>
                    {item.title}
                  </p>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggle(item.key as "email" | "sms" | "push")}
                  className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${
                    notifications[item.key as "email" | "sms" | "push"]
                      ? "bg-blue-600 justify-end"
                      : "bg-gray-300 justify-start"
                  }`}
                  aria-pressed={
                    notifications[item.key as "email" | "sms" | "push"]
                  }
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold">App Preferences</h2>
              <p className="text-sm text-gray-600">
                Customize your dashboard experience
              </p>
            </div>

            <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setTheme("light")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  theme === "light"
                    ? "bg-white shadow text-blue-700"
                    : "text-gray-700"
                }`}
              >
                <FiSun /> Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  theme === "dark"
                    ? "bg-white shadow text-blue-700"
                    : "text-gray-700"
                }`}
              >
                <FiMoon /> Dark
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="font-semibold text-gray-900">Theme</p>
              <p className="text-sm text-gray-600">
                Choose your preferred theme
              </p>
            </div>

            <div>
              <p className="font-semibold text-gray-900">Table Page Size</p>
              <p className="text-sm text-gray-600">Default rows per page</p>
              <div className="mt-2">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value)}
                  className="w-56 px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                >
                  {[
                    "10 rows per page",
                    "20 rows per page",
                    "50 rows per page",
                  ].map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <p className="font-semibold text-gray-900">Default Date Range</p>
              <p className="text-sm text-gray-600">For dashboard and reports</p>
              <div className="mt-2">
                <select
                  value={defaultRange}
                  onChange={(e) => setDefaultRange(e.target.value)}
                  className="w-56 px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                >
                  {["Today", "This Week", "This Month", "This Quarter"].map(
                    (opt) => (
                      <option key={opt}>{opt}</option>
                    ),
                  )}
                </select>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Page;
