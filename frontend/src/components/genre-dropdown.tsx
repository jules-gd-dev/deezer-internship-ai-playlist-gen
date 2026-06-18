"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import {
  Music, Sparkles, Guitar, Radio, Mic, Piano, Music3,
  Headphones, Heart, Sun, Zap, TreePine, Flame, Sparkle, CloudMoon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Genre } from "@/types";

const iconMap: Record<string, LucideIcon> = {
  Music, Sparkles, Guitar, Radio, Mic, Piano, Music3,
  Headphones, Heart, Sun, Zap, TreePine, Flame, Sparkle, CloudMoon,
};

interface GenreDropdownProps {
  genres: Genre[];
  selected: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function GenreDropdown({ genres, selected, onSelect, disabled = false }: GenreDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = genres.find((g) => g.id === selected) ?? genres[0];
  const CurrentIcon = iconMap[current.icon] ?? Music;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    // Use a timeout so the opening click doesn't immediately close
    const id = setTimeout(() => {
      document.addEventListener("click", onClickOutside);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("click", onClickOutside);
    };
  }, [open, close]);

  const toggleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setOpen((v) => !v);
  };

  const selectGenre = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={toggleOpen}
        className={`
          w-full h-12 pl-4 pr-3 rounded-xl text-sm font-medium text-white
          bg-white/[0.03] border border-white/[0.05] outline-none transition-colors
          hover:bg-white/[0.05] flex items-center gap-3
          ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <CurrentIcon className="w-4 h-4 text-white/30 shrink-0" strokeWidth={2} />
        <span className="flex-1 text-left truncate">{current.name}</span>
        <ChevronDown
          className={`w-4 h-4 text-white/40 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Menu */}
      {open && (
        <div className="absolute z-50 left-0 right-0 bottom-full mb-2 py-2 bg-[#1a1a1a] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 max-h-72 overflow-y-auto overscroll-contain">
          {genres.map((genre) => {
            const Icon = iconMap[genre.icon] ?? Music;
            const isActive = selected === genre.id;
            return (
              <button
                key={genre.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  selectGenre(genre.id);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-sm
                  transition-colors cursor-pointer
                  ${isActive
                    ? "text-white bg-white/[0.06]"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  }
                `}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? "text-deezer" : "text-white/40"}`}
                  strokeWidth={2}
                />
                <span className="flex-1 text-left">{genre.name}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-deezer shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
