import { FiCrosshair } from "react-icons/fi";
import Image from "next/image";
import AuthLoginCard from "@/components/AuthLoginCard";
import { PLATFORM_LOGO_SRC } from "@/libs/brand";

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <section className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative flex items-center justify-center overflow-hidden border-r border-slate-300/70 bg-[linear-gradient(180deg,#edf3f8_0%,#dfe8f0_100%)] px-6 py-10 sm:px-10 lg:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.9),transparent_18%),radial-gradient(circle_at_80%_38%,rgba(165,199,222,0.28),transparent_14%),radial-gradient(circle_at_28%_78%,rgba(187,211,231,0.34),transparent_16%)]" />

          <div className="relative z-10 w-full max-w-lg">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-300 bg-white/85 text-3xl text-slate-700 shadow-[0_14px_40px_rgba(94,122,150,0.12)] backdrop-blur">
                <FiCrosshair />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                  Hospital Operations
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
                  Hospital Revenue Management System
                </h1>
              </div>
            </div>

            <p className="max-w-xl text-base leading-7 text-slate-600">
              A focused access point for admins, finance teams, and payment
              agents working across hospital revenue operations.
            </p>
            {/* 
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {quickStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-300/80 bg-white/72 px-4 py-4 shadow-[0_10px_30px_rgba(112,138,162,0.1)] backdrop-blur"
                >
                  <div className="rounded-2xl bg-[#e6f1f8] p-3 text-sky-700 w-fit">
                    {item.icon}
                  </div>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div> */}

            <div className="mt-8">
              <AuthLoginCard mode="embedded" />
            </div>

          </div>
        </div>

        <div className="hidden bg-slate-50 lg:block" aria-hidden="true">
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
