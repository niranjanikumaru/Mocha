"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  showRadialGradient?: boolean;
}

export default function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
}: AuroraBackgroundProps) {
  useEffect(() => {
    const styleId = "aurora-bg-keyframes";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes aurora-float-1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(40px, -30px) scale(1.1);
          }
        }
        @keyframes aurora-float-2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-30px, 30px) scale(1.15);
          }
        }
        @keyframes aurora-float-3 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(25px, 25px) scale(0.95);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden select-none z-0",
        className
      )}
    >
      {/* Aurora Orb 1 - Warm Amber / Gold */}
      <div
        style={{
          animation: "aurora-float-1 16s ease-in-out infinite",
        }}
        className="absolute top-[-10%] left-[15%] w-[45vw] h-[400px] rounded-full bg-gradient-to-br from-amber-500/15 via-orange-600/10 to-transparent blur-[120px] will-change-transform"
      />

      {/* Aurora Orb 2 - Electric Cyan / Sapphire */}
      <div
        style={{
          animation: "aurora-float-2 20s ease-in-out infinite",
        }}
        className="absolute top-[10%] right-[10%] w-[40vw] h-[450px] rounded-full bg-gradient-to-bl from-blue-600/12 via-indigo-600/10 to-transparent blur-[130px] will-change-transform"
      />

      {/* Aurora Orb 3 - Deep Emerald / Mint */}
      <div
        style={{
          animation: "aurora-float-3 18s ease-in-out infinite",
        }}
        className="absolute bottom-[-10%] left-[30%] w-[50vw] h-[350px] rounded-full bg-gradient-to-tr from-emerald-600/10 via-teal-500/10 to-transparent blur-[140px] will-change-transform"
      />

      {showRadialGradient && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,var(--bg-base)_80%)]" />
      )}
      {children}
    </div>
  );
}
