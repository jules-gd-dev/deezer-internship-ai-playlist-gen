"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Play, Pause, ExternalLink } from "lucide-react";
import type { EnrichedTrack } from "@/types";

interface PlaylistTrackProps {
  track: EnrichedTrack;
  index: number;
}

export function PlaylistTrack({ track, index }: PlaylistTrackProps) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePreview = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  };

  return (
    <div
      className="stagger-item flex items-center gap-3 sm:gap-4 p-3 rounded-xl transition-colors group hover:bg-white/[0.04]"
    >
      <span className="text-xs font-mono w-5 text-right shrink-0 text-white/20">
        {index + 1}
      </span>

      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-surface">
        {track.albumCover && (
          <Image
            src={track.albumCover}
            alt={`${track.albumName} by ${track.artist}`}
            fill
            className="object-cover"
            sizes="48px"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-white truncate tracking-tight">
          {track.title}
        </p>
        <p className="text-sm text-white/50 truncate">{track.artist}</p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs tabular-nums text-white/20 mr-1 hidden sm:block">
          {formatDuration(track.duration)}
        </span>

        {track.previewUrl && (
          <button
            onClick={togglePreview}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              playing
                ? "bg-deezer text-white"
                : "bg-white/[0.06] text-white/60 hover:bg-white/[0.12] hover:text-white"
            }`}
            title={playing ? "Pause" : "Preview"}
          >
            {playing ? (
              <Pause className="w-3.5 h-3.5" fill="currentColor" />
            ) : (
              <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />
            )}
          </button>
        )}

        <a
          href={track.deezerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-white/30 hover:text-deezer"
          title="Open in Deezer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <audio ref={audioRef} src={track.previewUrl} onEnded={() => setPlaying(false)} preload="none" />
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
