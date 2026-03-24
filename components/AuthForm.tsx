"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { clearAgentTokens, storeAgentTokens } from "@/libs/auth";
import { loginAgent } from "@/libs/agent-auth";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export default function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: loginAgent,
    onSuccess: (response) => {
      const accessToken = response.data?.accessToken;
      const refreshToken = response.data?.refreshToken;

      if (!accessToken || !refreshToken) {
        toast.error("Login succeeded but no token was returned.");
        return;
      }

      storeAgentTokens({ accessToken, refreshToken });
      toast.success(response.message || "Login successful.");
      router.push("/agents/dashboard");
    },
    onError: (error) => {
      clearAgentTokens();
      toast.error(getErrorMessage(error));
    },
  });

  const helperCards = useMemo(
    () => [
      "React Query handles the login mutation state",
      "JWT tokens are stored after successful agent login",
      "Agent users are redirected into protected agent routes",
    ],
    [],
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginMutation.mutate({
      email: email.trim(),
      password,
    });
  };

  return (
    <main className="min-h-screen bg-[#f4efe6] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#0f3d3e] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.24),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(251,146,60,0.2),_transparent_30%)]" />

          <div className="relative">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-teal-100 transition hover:text-white"
            >
              <FiArrowLeft />
              Back to welcome page
            </Link>

            <p className="mt-14 text-sm uppercase tracking-[0.35em] text-teal-200">
              Agent access
            </p>
            <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight">
              Login to the agent workspace
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-teal-50/85">
              Sign in with your assigned agent account to process payments,
              manage receipts, and access agent-only routes from the API.
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
          <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,61,62,0.12)] sm:p-8">
            <div className="mb-8 lg:hidden">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                <FiArrowLeft />
                Back
              </Link>
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#0f766e]">
                Agent access
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950">
                Login to the agent workspace
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Use the backend login endpoint for agents. Account creation is
                still handled by admins inside the platform.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Email address
                </span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#0f766e] focus:bg-white"
                  type="email"
                  placeholder="you@hospital.com"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </span>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 outline-none transition focus:border-[#0f766e] focus:bg-white"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f3d3e] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#125354] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loginMutation.isPending ? "Please wait..." : "Login"}
                <FiArrowRight />
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
