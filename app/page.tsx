import Image from "next/image";
import AuthLoginCard from "@/components/AuthLoginCard";
import { PLATFORM_LOGO_SRC } from "@/libs/brand";

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(240,249,255,0.92)_38%,rgba(224,242,254,0.88)_100%)] dark:bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.95),transparent_24%),radial-gradient(circle_at_82%_78%,rgba(45,212,191,0.18),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(125,211,252,0.18),transparent_24%)]" />
      <section className="relative flex min-h-screen items-center justify-center px-6 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-7 flex flex-col items-center text-center">
            <Image
              src={PLATFORM_LOGO_SRC}
              alt="SwiftRev logo"
              width={100}
              height={100}
              className="h-16 w-16 object-contain scale-[3.65]"
              priority
            />

            <h1 className="m-8 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Welcome to SwiftRev
            </h1>
          </div>

          <AuthLoginCard mode="embedded" />
        </div>
      </section>
    </main>
  );
}
