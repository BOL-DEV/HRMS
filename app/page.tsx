import Link from "next/link";
import { FiArrowRight, FiLock, FiShield, FiTrendingUp } from "react-icons/fi";

const highlights = [
  {
    title: "Role-based access",
    description:
      "Separate experiences for admins, finance teams, and agents without mixing responsibilities.",
    icon: <FiShield className="text-2xl" />,
  },
  {
    title: "Live revenue visibility",
    description:
      "Track collections, receipts, and refund activity from a single operations workspace.",
    icon: <FiTrendingUp className="text-2xl" />,
  },
  {
    title: "Secure login flow",
    description:
      "Authentication is ready to connect to backend APIs while admin-managed account creation stays inside the platform.",
    icon: <FiLock className="text-2xl" />,
  },
];

export default function Page() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.18),transparent_28%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-teal-300">
              HRMS
            </p>
            <h1 className="mt-2 text-xl font-semibold text-slate-100">
              Hospital Revenue Management System
            </h1>
          </div>

          <Link
            href="/login"
            className="rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Login
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-2 text-sm text-teal-100">
              Built for finance teams, hospital admins, and payment agents
            </div>

            <h2 className="mt-6 text-5xl font-semibold leading-tight text-balance text-white md:text-6xl">
              Welcome to the front door of your hospital operations platform.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Start with secure login access, then connect the dashboards to
              your backend APIs for transactions, receipts, patients, and
              hospital performance data. New agents and financial office users
              are created by admins inside the platform.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-400 px-6 py-4 text-base font-semibold text-slate-950 transition hover:bg-teal-300"
              >
                Login to continue
                <FiArrowRight />
              </Link>
            </div>
          </div>

          <div className="rounded-4xl border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-orange-300">
                    Ready to connect
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">
                    Login first, APIs next
                  </h3>
                </div>

                <div className="rounded-2xl bg-orange-400/15 px-3 py-2 text-sm text-orange-200">
                  Step 1
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {highlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/4 p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-white/10 p-3 text-teal-300">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">
                          {item.title}
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
