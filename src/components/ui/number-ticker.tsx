"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface NumberTickerProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number; // seconds
}

export default function NumberTicker({
  value,
  decimals = 2,
  prefix = "",
  suffix = "",
  className,
  duration = 1.2,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent =
          prefix + v.toFixed(decimals) + suffix;
      }
    });
  }, [springValue, decimals, prefix, suffix]);

  return (
    <motion.span
      ref={ref}
      className={cn("tabular-nums", className)}
    >
      {prefix}0{decimals > 0 ? "." + "0".repeat(decimals) : ""}{suffix}
    </motion.span>
  );
}
