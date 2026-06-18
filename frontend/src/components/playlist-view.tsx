"use client";

import { PlaylistTrack } from "./playlist-track";
import type { EnrichedTrack } from "@/types";

interface PlaylistViewProps {
  tracks: EnrichedTrack[];
  prompt: string;
}

export function PlaylistView({ tracks, prompt }: PlaylistViewProps) {
  return (
    <div>
      <div className="flex items-end justify-between mb-5">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-[-0.03em] font-sans">
            Your Playlist
          </h2>
          <p className="text-sm text-white/50 mt-1.5 truncate italic">
            &ldquo;{prompt}&rdquo;
          </p>
        </div>
        <span className="text-xs font-semibold text-white/50 bg-white/[0.06] px-3 py-1.5 rounded-full shrink-0 ml-3">
          {tracks.length} tracks
        </span>
      </div>

      <div className="card p-2">
        {tracks.map((track, i) => (
          <div key={`${track.id}-${i}`}>
            {i > 0 && <div className="mx-3 h-px bg-white/[0.04]" />}
            <PlaylistTrack track={track} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
