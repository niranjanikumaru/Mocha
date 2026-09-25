"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowPulseProps {
  color?: "brand" | "green" | "red" | "yellow";
  size?: number;
  className?: string;
  /** Whether to pulse continuously */
  pulse?: boolean;
}

const colorMap = {
  brand: { dot: "bg-[var(--brand)]", ring: "bg-[var(--brand)]" },
  green: { dot: "bg-[var(--green)]", ring: "bg-[var(--green)]" },
  red:   { dot: "bg-[var(--red)]",   ring: "bg-[var(--red)]" },
  yellow:{ dot: "bg-[var(--yellow)]",ring: "bg-[var(--yellow)]" },
};

export default function GlowPulse({ color = "brand", size = 8, pulse = true, className }: GlowPulseProps) {
  const c = colorMap[color];
  return (
    <span className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}>
      {pulse && (
        <motion.span
          className={cn("absolute inline-flex rounded-full opacity-75", c.ring)}
          style={{ width: size, height: size }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <span
        className={cn("relative inline-flex rounded-full", c.dot)}
        style={{ width: size * 0.625, height: size * 0.625 }}
      />
    </span>
  );
}
