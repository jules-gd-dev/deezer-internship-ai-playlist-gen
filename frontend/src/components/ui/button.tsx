"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading, fullWidth, children, className = "", disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-lg h-12 px-6 text-sm font-bold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed select-none tracking-tight";

    const variants = {
      primary:
        "bg-deezer text-white hover:bg-[#B25CFF] active:bg-[#8E2DE2] active:scale-[0.98]",
      secondary:
        "bg-surface text-white/80 border border-border hover:bg-surface-elevated",
      ghost:
        "text-white/60 hover:text-white hover:bg-white/5",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${fullWidth ? "w-full sm:w-auto" : ""} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <div className="spinner-gradient" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
