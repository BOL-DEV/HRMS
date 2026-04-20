"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import AuthLoginCard from "@/components/AuthLoginCard";

export default function AuthForm() {
  const helperCards = useMemo(
    () => [
      "React Query handles the login mutation state",
      "JWT tokens are stored after successful login",
      "Admins, finance officers, and agents are redirected by accepted role checks",
    ],
    [],
  );

  return (
    <main className="min-h-screen bg-[#f4efe6] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#0f3d3e] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.24),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(251,146,60,0.2),transparent_30%)]" />

          <div className="relative">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-teal-100 transition hover:text-white"
            >
              <FiArrowLeft />
              Back to welcome page
            </Link>

            <p className="mt-14 text-sm uppercase tracking-[0.35em] text-teal-200">
              Secure access
            </p>
            <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight">
              Login to your workspace
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-teal-50/85">
              Sign in with your assigned account and we will route you to the
              correct dashboard for your role.
            </p>
          </div>

          <div className="relative space-y-4">
            {helperCards.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-4 backdrop-blur"
              >
                <FiCheckCircle className="shrink-0 text-xl text-orange-300" />
                <p className="text-sm text-teal-50">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-xl">
            <div className="mb-8 lg:hidden">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                <FiArrowLeft />
                Back
              </Link>
            </div>

            <AuthLoginCard mode="page" />
          </div>
        </section>
      </div>
    </main>
  );
}
