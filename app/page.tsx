import { FiCrosshair } from "react-icons/fi";
import Image from "next/image";
import AuthLoginCard from "@/components/AuthLoginCard";
import { PLATFORM_LOGO_SRC } from "@/libs/brand";

export default function Page() {
  return (
    <main className="min-h-screen bg-canvas">
      <section className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative flex items-center justify-center overflow-hidden border-r border-line-subtle bg-gradient-to-b from-brand-50 via-canvas-alt to-brand-100 px-6 py-10 sm:px-10 lg:px-12 dark:from-brand-950 dark:via-canvas dark:to-brand-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.82),transparent_18%),radial-gradient(circle_at_80%_38%,rgba(45,212,191,0.18),transparent_16%),radial-gradient(circle_at_28%_78%,rgba(20,184,166,0.14),transparent_18%)] dark:bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.06),transparent_18%),radial-gradient(circle_at_80%_38%,rgba(45,212,191,0.16),transparent_16%),radial-gradient(circle_at_28%_78%,rgba(13,148,136,0.18),transparent_18%)]" />

          <div className="relative z-10 w-full max-w-lg">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-brand-200 bg-white/85 text-3xl text-brand-700 shadow-[0_14px_40px_rgba(15,118,110,0.12)] backdrop-blur dark:border-brand-800 dark:bg-slate-950/50 dark:text-brand-200">
                <FiCrosshair />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-700 dark:text-brand-300">
                  Hospital Operations
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
                  Hospital Revenue Management System
                </h1>
              </div>
            </div>

            <p className="max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
              A focused access point for admins, finance teams, and payment
              agents working across hospital revenue operations.
            </p>

            <div className="mt-8">
              <AuthLoginCard mode="embedded" />
            </div>
          </div>
        </div>

        <div className="hidden bg-canvas-alt lg:block dark:bg-panel" aria-hidden="true">
          <div className="flex h-full w-full items-center justify-center px-10">
            <Image
              src={PLATFORM_LOGO_SRC}
              alt="SwiftRev"
              width={820}
              height={300}
              className="h-auto w-[min(600px,88%)] object-contain opacity-95"
              priority
            />
          </div>
        </div>
      </section>
    </main>
  );
}
