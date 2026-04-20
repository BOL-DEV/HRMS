"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { SubmitEvent, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowRight, FiEye, FiEyeOff } from "react-icons/fi";
import { getAdminDashboard } from "@/libs/admin-auth";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, storeAgentTokens } from "@/libs/auth";
import { getAgentProfile, loginAgent } from "@/libs/agent-auth";
import { getFoProfile } from "@/libs/fo-auth";

type Props = {
  mode?: "embedded" | "page";
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export default function AuthLoginCard({ mode = "page" }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: loginAgent,
    onSuccess: async (response) => {
      const accessToken = response.data?.accessToken;
      const refreshToken = response.data?.refreshToken;

      if (!accessToken || !refreshToken) {
        toast.error("Login succeeded but no token was returned.");
        return;
      }

      storeAgentTokens({ accessToken, refreshToken });

      try {
        await getAdminDashboard();
        toast.success(response.message || "Login successful.");
        router.push("/admin/dashboard");
        return;
      } catch (error) {
        if (!(error instanceof ApiError) || ![401, 403, 404].includes(error.status)) {
          clearAuthTokens();
          toast.error(getErrorMessage(error));
          return;
        }
      }

      try {
        await getFoProfile();
        toast.success(response.message || "Login successful.");
        router.push("/fo/dashboard");
        return;
      } catch (error) {
        if (!(error instanceof ApiError) || ![401, 403, 404].includes(error.status)) {
          clearAuthTokens();
          toast.error(getErrorMessage(error));
          return;
        }
      }

      try {
        await getAgentProfile();
        toast.success(response.message || "Login successful.");
        router.push("/agents/dashboard");
        return;
      } catch (error) {
        clearAuthTokens();
        toast.error(getErrorMessage(error));
      }
    },
    onError: (error) => {
      clearAuthTokens();
      toast.error(getErrorMessage(error));
    },
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate({
      email: email.trim(),
      password,
    });
  };

  const isEmbedded = mode === "embedded";

  return (
    <div
      className={
        isEmbedded
          ? "w-full rounded-[2rem] border border-slate-300/80 bg-white/88 p-5 shadow-[0_24px_80px_rgba(112,138,162,0.18)] backdrop-blur"
          : "w-full max-w-xl rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,61,62,0.12)] sm:p-8"
      }
    >
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-[#0f766e]">
          Secure access
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-slate-950">
          Login to your workspace
        </h2>
   
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Email address
          </span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1779d2] focus:bg-white"
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
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 outline-none transition focus:border-[#1779d2] focus:bg-white"
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1779d2] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#1169b8] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loginMutation.isPending ? "Please wait..." : "Login"}
          <FiArrowRight />
        </button>
      </form>
    </div>
  );
}
