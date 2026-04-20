import { FiActivity, FiBriefcase, FiCrosshair, FiShield } from "react-icons/fi";
import AuthLoginCard from "@/components/AuthLoginCard";

const quickStats = [
  {
    label: "Secure Access",
    value: "Role-based",
    icon: <FiShield className="text-lg" />,
  },
  {
    label: "Operations",
    value: "Payments + Receipts",
    icon: <FiBriefcase className="text-lg" />,
  },
  {
    label: "Monitoring",
    value: "Live Revenue",
    icon: <FiActivity className="text-lg" />,
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-[#dfe7ef] text-slate-900">
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
            </div>

            <div className="mt-8">
              <AuthLoginCard mode="embedded" />
            </div>
          </div>
        </div>

        <div className="relative hidden overflow-hidden lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#d9edf7_0%,#c8e1ef_24%,#afd3e6_52%,#d3ecf7_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_24%,rgba(255,255,255,0.95),transparent_15%),radial-gradient(circle_at_76%_70%,rgba(255,255,255,0.72),transparent_14%),radial-gradient(circle_at_26%_16%,rgba(122,180,215,0.34),transparent_22%)]" />

          <div className="absolute inset-0 opacity-55">
            <div className="absolute -left-16 top-18 h-28 w-[72%] rotate-[11deg] rounded-full bg-white/70 shadow-[0_0_0_10px_rgba(255,255,255,0.12)]" />
            <div className="absolute left-22 top-27 h-5 w-[61%] rotate-[11deg] rounded-full bg-slate-500/65" />
            <div className="absolute left-[35%] top-[14%] h-52 w-52 rounded-full border-[18px] border-[#7bb8d8]/90 bg-white/70 shadow-[0_30px_80px_rgba(117,166,197,0.18)]" />
            <div className="absolute left-[44%] top-[23%] h-32 w-32 rounded-full bg-white/95 shadow-inner" />
            <div className="absolute left-[26%] top-[43%] h-56 w-7 rotate-[28deg] rounded-full bg-slate-500/70" />
            <div className="absolute left-[20%] top-[55%] h-26 w-26 rounded-full bg-[#83bddc]/90 shadow-[0_20px_50px_rgba(103,152,186,0.25)]" />
          </div>

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.35),transparent_34%)]" />

          <div className="absolute inset-0 flex items-center justify-center px-10">
            <div className="w-[32rem] max-w-[78%]">
              <div className="relative flex items-center justify-center">
                <div className="absolute left-0 top-1/2 w-28 -translate-y-1/2 space-y-4">
                  <div className="h-4 w-18 rounded-full bg-[#123f49]" />
                  <div className="h-4 w-28 rounded-full bg-[#123f49]" />
                  <div className="h-4 w-22 rounded-full bg-[#123f49]" />
                </div>

                <div className="relative ml-14 rounded-[1.8rem] bg-[#123f49] px-9 py-5 shadow-[0_22px_50px_rgba(18,63,73,0.25)]">
                  <span className="text-7xl font-black leading-none tracking-tight text-white">
                    swift
                  </span>
                </div>

                <div className="ml-4">
                  <span className="text-7xl font-black italic leading-none tracking-tight text-[#55b8b0] drop-shadow-[0_12px_24px_rgba(71,166,160,0.24)]">
                    Rev
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 right-10  px-6 py-4 text-right backdrop-blur">
            <p className="mt-4 text-sm text-slate-600">
              Powered by{" "}
              <span className="font-semibold text-slate-900">SwiftRev</span>
            </p>
            <a
              href="https://www.swiftrevenue.me"
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm font-medium text-[#1779d2] transition hover:text-[#1169b8]"
            >
              www.swiftrevenue.me
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
