"use client";

import React from "react";
import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type AnimatedButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  MotionProps & {
    children?: React.ReactNode;
    variant?: "primary" | "secondary" | "danger" | "ghost";
    size?: "sm" | "md" | "lg";
  };

const variants = {
  primary: "bg-[var(--brand)] text-black hover:bg-amber-400 border-[var(--brand)]",
  secondary: "bg-[var(--bg-interactive)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border-[var(--border)]",
  danger: "bg-[var(--red)] text-white hover:bg-red-400 border-[var(--red)]",
  ghost: "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-interactive)] border-transparent",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3 text-base",
};

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children = "Submit",
  className = "",
  variant = "primary",
  size = "md",
  disabled,
  ...rest
}) => {
  return (
    <motion.button
      {...(rest as MotionProps)}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border font-semibold",
        "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </motion.button>
  );
};

export default AnimatedButton;
