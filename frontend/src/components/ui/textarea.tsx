"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full rounded-xl px-5 py-4 text-base text-white placeholder-white/30 bg-surface border border-border outline-none transition-colors focus:border-deezer resize-none ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
