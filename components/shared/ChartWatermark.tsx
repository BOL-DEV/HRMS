"use client";

import Image from "next/image";

type Props = {
  className?: string;
};

function ChartWatermark({ className = "" }: Props) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-3 opacity-[0.07]">
        <Image
          src="/swiftRev.png"
          alt="SwiftRev watermark"
          width={112}
          height={112}
          className="h-28 w-28 object-contain"
        />
        <span className="text-3xl font-bold uppercase tracking-[0.45em] text-slate-900 dark:text-slate-100">
          SwiftRev
        </span>
      </div>
    </div>
  );
}

export default ChartWatermark;
