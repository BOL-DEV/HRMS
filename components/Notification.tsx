"use client";

import { useState } from 'react'
import { FiMail, FiBell, FiSmartphone } from "react-icons/fi"


function Notification() {
    const [notifications, setNotifications] = useState({
        email: true,
        sms: false,
        push: true,
    });
    
      const toggle = (key: "email" | "sms" | "push") => {
        setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
      };

    return (
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
    )
}

export default Notification
