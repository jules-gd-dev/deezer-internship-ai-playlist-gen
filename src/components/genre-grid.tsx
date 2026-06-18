"use client";

import {
  Music, Sparkles, Guitar, Radio, Mic, Piano, Music3,
  Headphones, Heart, Sun, Zap, TreePine, Flame, Sparkle, CloudMoon,
} from "lucide-react";
import type { Genre } from "@/types";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Music, Sparkles, Guitar, Radio, Mic, Piano, Music3,
  Headphones, Heart, Sun, Zap, TreePine, Flame, Sparkle, CloudMoon,
};

interface GenreGridProps {
  genres: Genre[];
  selected: string;
  onSelect: (id: string) => void;
}

export function GenreGrid({ genres, selected, onSelect }: GenreGridProps) {
  return (
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {genres.map((genre) => {
        const isActive = selected === genre.id;
        const Icon = iconMap[genre.icon] ?? Music;
        return (
          <button
            key={genre.id}
            onClick={() => onSelect(genre.id)}
            className="card flex flex-col items-center gap-3 p-4 sm:p-5 min-h-[90px] cursor-pointer"
            style={{
              background: isActive
                ? "linear-gradient(135deg, rgba(162, 56, 255, 0.22), rgba(97, 0, 224, 0.12))"
                : undefined,
              borderColor: isActive ? "rgba(162, 56, 255, 0.45)" : "transparent",
              borderWidth: "1.5px",
              borderStyle: "solid",
            }}
          >
            <Icon
              className={`w-5 h-5 sm:w-[22px] sm:h-[22px] transition-colors ${
                isActive ? "text-deezer" : "text-text-secondary"
              }`}
              strokeWidth={1.75}
            />
            <span
              className="text-xs sm:text-sm font-medium leading-tight text-center tracking-tight transition-colors"
              style={{ color: isActive ? "#fff" : "rgba(220, 215, 235, 0.65)" }}
            >
              {genre.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
