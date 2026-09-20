"use client";

import React, { useId, useEffect } from "react";
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number; // beam length percentage (default 22)
  duration?: number;
  borderWidth?: number;
  borderRadius?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export const BorderBeam = ({
  className,
  size = 22,
  duration = 10,
  borderWidth = 2,
  borderRadius = 12,
  colorFrom = "#f59e0b",
  colorTo = "#3b82f6",
  delay = 0,
}: BorderBeamProps) => {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gradientId = `beam-grad-${reactId}`;
  const filterId = `beam-blur-${reactId}`;

  // Ensure keyframe is registered
  useEffect(() => {
    const styleId = "border-beam-svg-keyframes";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes border-beam-svg-trace {
          0% {
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const dashArray = `${Math.max(5, Math.min(60, size))} ${Math.max(40, 100 - Math.max(5, Math.min(60, size)))}`;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 w-full h-full rounded-[inherit] overflow-hidden z-10",
        className
      )}
    >
      <svg
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorFrom} stopOpacity="1" />
            <stop offset="100%" stopColor={colorTo} stopOpacity="1" />
          </linearGradient>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Outer soft glow layer */}
        <rect
          x={borderWidth / 2}
          y={borderWidth / 2}
          width={`calc(100% - ${borderWidth}px)`}
          height={`calc(100% - ${borderWidth}px)`}
          rx={borderRadius}
          ry={borderRadius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={borderWidth * 2}
          strokeOpacity={0.5}
          pathLength="100"
          strokeDasharray={dashArray}
          filter={`url(#${filterId})`}
          style={{
            animation: `border-beam-svg-trace ${duration}s linear infinite`,
            animationDelay: `${delay}s`,
          }}
        />

        {/* Sharp core beam */}
        <rect
          x={borderWidth / 2}
          y={borderWidth / 2}
          width={`calc(100% - ${borderWidth}px)`}
          height={`calc(100% - ${borderWidth}px)`}
          rx={borderRadius}
          ry={borderRadius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={borderWidth}
          pathLength="100"
          strokeDasharray={dashArray}
          style={{
            animation: `border-beam-svg-trace ${duration}s linear infinite`,
            animationDelay: `${delay}s`,
          }}
        />
      </svg>
    </div>
  );
};
