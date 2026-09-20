"use client";

import { cn } from "@/lib/utils";

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
  duration?: number;
}

export default function ShimmerText({
  children,
  className,
  shimmerWidth = 100,
  duration = 2,
}: ShimmerTextProps) {
  return (
    <span
      style={
        {
          "--shimmer-width": `${shimmerWidth}px`,
          "--duration": `${duration}s`,
        } as React.CSSProperties
      }
      className={cn(
        "relative inline-block bg-clip-text text-transparent",
        "[background-image:linear-gradient(110deg,var(--text-secondary)_40%,var(--brand)_50%,var(--text-secondary)_60%)]",
        "[background-size:200%_100%]",
        "animate-shimmer-text",
        className
      )}
    >
      {children}
      <style>{`
        @keyframes shimmer-text {
          0%   { background-position: 100% center; }
          100% { background-position: -100% center; }
        }
        .animate-shimmer-text {
          animation: shimmer-text var(--duration, 2s) linear infinite;
        }
      `}</style>
    </span>
  );
}
