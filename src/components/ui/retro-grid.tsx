"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";

interface RetroGridProps {
  className?: string;
  angle?: number;
  cellSize?: number;
  opacity?: number;
  lineColor?: string;
}

export default function RetroGrid({
  className,
  angle = 65,
  cellSize = 50,
  opacity = 0.35,
  lineColor = "rgba(245, 158, 11, 0.15)",
}: RetroGridProps) {
  useEffect(() => {
    const styleId = "retro-grid-keyframes";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes retro-grid-move {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(${cellSize}px);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, [cellSize]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden [perspective:200px] select-none z-0",
        className
      )}
      style={{ opacity }}
    >
      {/* 3D Grid Plane */}
      <div
        className="absolute inset-0 origin-bottom"
        style={{
          transform: `rotateX(${angle}deg)`,
        }}
      >
        <div
          style={{
            backgroundImage: `linear-gradient(to right, ${lineColor} 1px, transparent 0), linear-gradient(to bottom, ${lineColor} 1px, transparent 0)`,
            backgroundSize: `${cellSize}px ${cellSize}px`,
            animation: "retro-grid-move 12s linear infinite",
          }}
          className="absolute -top-[250%] -left-[50%] h-[500%] w-[200%] [background-repeat:repeat]"
        />
      </div>

      {/* Horizon Mask Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/40 to-[var(--bg-base)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--bg-base)_80%)]" />
    </div>
  );
}
