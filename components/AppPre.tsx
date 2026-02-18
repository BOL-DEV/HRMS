"use client";

import { useState } from 'react'
import { FiSun, FiMoon } from "react-icons/fi"

function AppPre() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [defaultRange, setDefaultRange] = useState("This Month");

    return (
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


      </section>
    );
}

export default AppPre
