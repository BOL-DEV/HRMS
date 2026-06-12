import Image from "next/image";
import AuthLoginCard from "@/components/AuthLoginCard";
import { PLATFORM_LOGO_SRC } from "@/libs/brand";

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(255,255,255,0.72),transparent_24%),radial-gradient(circle_at_78%_20%,rgba(20,184,166,0.14),transparent_26%),radial-gradient(circle_at_82%_84%,rgba(13,148,136,0.12),transparent_28%),linear-gradient(180deg,rgba(245,251,250,1)_0%,rgba(237,247,245,1)_54%,rgba(223,244,240,0.92)_100%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(20,184,166,0.10),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(59,130,246,0.08),transparent_22%),linear-gradient(180deg,rgba(3,8,22,1)_0%,rgba(10,19,37,1)_50%,rgba(17,27,49,1)_100%)]" />
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-brand-300/25 blur-3xl dark:bg-brand-500/12" />
      <div className="absolute right-16 top-1/3 h-80 w-80 rounded-full bg-brand-200/20 blur-3xl dark:bg-sky-500/10" />
      <div className="absolute -bottom-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-white/30 blur-3xl dark:bg-brand-400/8" />

      <section className="relative flex min-h-screen items-center justify-center px-6 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <Image
              src={PLATFORM_LOGO_SRC}
              alt="Platform logo"
              width={300}
              height={300}
              className="h-40 w-40 object-contain sm:h-40 sm:w-40"
              priority
            />
          </div>
          <div className="rounded-[2.25rem] border border-white/60 bg-white/28 p-3 shadow-[0_32px_100px_rgba(15,23,42,0.10)] backdrop-blur-2xl dark:border-line-subtle dark:bg-panel/35">
            <AuthLoginCard mode="embedded" />
          </div>
        </div>
      </section>
    </main>
  );
}
