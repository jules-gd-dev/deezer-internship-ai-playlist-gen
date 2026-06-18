"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Play, Pause, ExternalLink, Clock, Music } from "lucide-react";
import type { EnrichedTrack } from "@/types";

interface PlaylistViewProps {
  tracks: EnrichedTrack[];
  name?: string;
  selectable?: boolean;
  selectedTrackIds?: number[];
  onToggleSelect?: (track: EnrichedTrack) => void;
}

export function PlaylistView({
  tracks,
  name,
  selectable = false,
  selectedTrackIds = [],
  onToggleSelect,
}: PlaylistViewProps) {
  const [playingTrack, setPlayingTrack] = useState<EnrichedTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const displayName = (() => {
    if (!name) return "Generated Playlist";
    const trimmed = name.trim().replace(/^["']|["']$/g, "");
    if (trimmed.length <= 40) return trimmed;
    for (const sep of [":", " — ", " - ", ", ", " (", " ["]) {
      const idx = trimmed.indexOf(sep);
      if (idx > 10 && idx <= 40) return trimmed.slice(0, idx);
    }
    const cut = trimmed.slice(0, 40);
    return cut.includes(" ") ? cut.split(" ").slice(0, -1).join(" ") + "…" : cut + "…";
  })();

  // Total duration calculation
  const totalSeconds = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const formatTotalDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) {
      return `${h} hr ${m} min`;
    }
    return `${m} min`;
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const togglePlay = (track: EnrichedTrack) => {
    if (!audioRef.current) return;

    if (playingTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      }
    } else {
      setPlayingTrack(track);
      setIsPlaying(true);
      audioRef.current.src = track.previewUrl;
      audioRef.current.load();
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  const playAll = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      const firstPlayable = tracks.find((t) => t.previewUrl);
      if (firstPlayable) {
        togglePlay(firstPlayable);
      }
    }
  };

  const handleEnded = () => {
    if (!playingTrack) return;
    const currentIndex = tracks.findIndex((t) => t.id === playingTrack.id);
    if (currentIndex !== -1 && currentIndex < tracks.length - 1) {
      // Find next track with preview
      const nextWithPreview = tracks.slice(currentIndex + 1).find((t) => t.previewUrl);
      if (nextWithPreview) {
        togglePlay(nextWithPreview);
      } else {
        setIsPlaying(false);
        setPlayingTrack(null);
      }
    } else {
      setIsPlaying(false);
      setPlayingTrack(null);
    }
  };

  // Reset audio state when tracks prop changes (during render phase to avoid cascading renders)
  const [prevTracks, setPrevTracks] = useState(tracks);
  if (tracks !== prevTracks) {
    setPrevTracks(tracks);
    setPlayingTrack(null);
    setIsPlaying(false);
  }

  // Stop audio on unmount
  useEffect(() => {
    const currentAudio = audioRef.current;
    return () => {
      if (currentAudio) {
        currentAudio.pause();
      }
    };
  }, []);

  // Cover collage: up to 4 unique covers
  const uniqueCovers = tracks
    .map((t) => t.albumCover)
    .filter((cover, index, self) => cover && self.indexOf(cover) === index)
    .slice(0, 4);
  // Dynamic grid classes
  const gridClass = selectable
    ? "grid grid-cols-[24px_30px_1fr_40px] sm:grid-cols-[24px_40px_1fr_1fr_50px_40px]"
    : "grid grid-cols-[30px_1fr_40px] sm:grid-cols-[40px_1fr_1fr_50px_40px]";

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Playlist Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-surface/40 border border-white/[0.04] p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 sm:gap-8 shadow-2xl backdrop-blur-md">
        {/* Cover Art Collage */}
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shrink-0 shadow-lg bg-white/[0.02] border border-white/[0.08] flex items-center justify-center">
          {uniqueCovers.length >= 4 ? (
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
              {uniqueCovers.map((cover, i) => (
                <div key={i} className="relative w-full h-full">
                  <Image
                    src={cover}
                    alt="Cover art segment"
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              ))}
            </div>
          ) : uniqueCovers.length > 0 ? (
            <div className="relative w-full h-full">
              <Image
                src={uniqueCovers[0]}
                alt="Playlist cover"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <Music className="w-12 h-12 text-white/10" />
          )}
        </div>

        {/* Playlist metadata */}
        <div className="flex-1 text-center md:text-left min-w-0 flex flex-col justify-end">
          <span className="text-[11px] font-bold tracking-[0.15em] text-deezer uppercase mb-2">
            AI Playlist
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-[-0.04em] leading-tight truncate">
            {displayName}
          </h2>
          <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1 text-xs text-white/40 font-medium">
            <span>Deezer AI</span>
            <span>•</span>
            <span className="text-white/60">{tracks.length} tracks</span>
            <span>•</span>
            <span>{formatTotalDuration(totalSeconds)}</span>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <button
              onClick={playAll}
              disabled={tracks.length === 0}
              className="h-11 px-6 rounded-lg bg-deezer text-white font-bold text-sm tracking-tight flex items-center gap-2 hover:bg-[#B25CFF] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-deezer/20"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" fill="currentColor" />
                  Pause Preview
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                  Preview Playlist
                </>
              )}
            </button>
            

          </div>
        </div>
      </div>

      {/* Tracks List */}
      <div className="flex flex-col">


        {/* Table header */}
        <div className={`${gridClass} gap-4 px-4 py-2 border-b border-white/[0.04] text-xs font-bold uppercase tracking-wider text-white/30 mb-2`}>
          {selectable && <span className="text-center"></span>}
          <span className="text-center">#</span>
          <span>Title</span>
          <span className="hidden sm:block">Album</span>
          <span className="hidden sm:flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </span>
          <span className="text-center"></span>
        </div>

        {/* Track Rows */}
        <div className="flex flex-col gap-0.5">
          {tracks.map((track, i) => {
            const isCurrent = playingTrack?.id === track.id;
            const isCurrentPlaying = isCurrent && isPlaying;
            const isSelected = selectedTrackIds.includes(track.id);

            return (
              <div
                key={`${track.id}-${i}`}
                onClick={() => track.previewUrl && togglePlay(track)}
                className={`${gridClass} gap-4 items-center px-4 py-3 rounded-xl transition-all group select-none ${
                  isCurrent || isSelected ? "" : "hover:bg-white/[0.03]"
                } ${track.previewUrl ? "cursor-pointer" : ""}`}
              >
                {/* Checkbox (if selectable) */}
                {selectable && onToggleSelect && (
                  <div className="flex items-center justify-center w-full h-8">
                    <div
                      onClick={() => onToggleSelect(track)}
                      className={`w-4.5 h-4.5 rounded border flex items-center justify-center cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? "border-deezer bg-deezer text-white"
                          : "border-white/20 hover:border-white/45 bg-transparent"
                      }`}
                    >
                      {isSelected && (
                        <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-none stroke-current" strokeWidth={4.5}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}

                {/* Index / Play Button */}
                <div className="flex items-center justify-center w-full h-8 relative">
                  {track.previewUrl ? (
                    <>
                      {/* Track number (or eq bars when playing) - desktop only, hidden on hover */}
                      <span className={`hidden md:inline group-hover:hidden text-[13px] font-medium font-mono text-white/30`}>
                        {isCurrentPlaying ? (
                          <div className="flex items-end justify-center gap-[2px] w-3 h-3.5">
                            <span className="w-[2px] bg-deezer animate-eq-bar-1" />
                            <span className="w-[2px] bg-deezer animate-eq-bar-2" />
                            <span className="w-[2px] bg-deezer animate-eq-bar-3" />
                          </div>
                        ) : (
                          i + 1
                        )}
                      </span>
                      {/* Desktop hover play/pause button (always purple) */}
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePlay(track); }}
                        className={`hidden md:group-hover:flex items-center justify-center w-7 h-7 rounded-full text-white transition-all scale-95 hover:scale-105 cursor-pointer bg-deezer`}
                      >
                        {isCurrentPlaying ? (
                          <Pause className="w-3.5 h-3.5" fill="currentColor" />
                        ) : (
                          <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />
                        )}
                      </button>
                      {/* Mobile: always show the track number */}
                      <span className="md:hidden text-[13px] font-medium font-mono text-white/30">
                        {isCurrentPlaying ? (
                          <div className="flex items-end justify-center gap-[2px] w-3 h-3.5">
                            <span className="w-[2px] bg-deezer animate-eq-bar-1" />
                            <span className="w-[2px] bg-deezer animate-eq-bar-2" />
                            <span className="w-[2px] bg-deezer animate-eq-bar-3" />
                          </div>
                        ) : (
                          i + 1
                        )}
                      </span>
                    </>
                  ) : (
                    <span className="text-[13px] font-medium font-mono text-white/15">
                      {i + 1}
                    </span>
                  )}
                </div>

                {/* Cover, Title and Artist */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/[0.02] border border-white/[0.04]">
                    {track.albumCover ? (
                      <Image
                        src={track.albumCover}
                        alt={track.albumName}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-white/20" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-[14px] font-semibold truncate leading-tight tracking-tight ${isCurrentPlaying ? "text-deezer" : "text-white"}`}>
                      {track.title}
                    </p>
                    <p className="text-[13px] text-white/55 truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>
                </div>

                {/* Album Name */}
                <div className="hidden sm:block text-[13px] text-white/50 truncate">
                  {track.albumName}
                </div>

                {/* Duration */}
                <div className="hidden sm:flex justify-center text-[13px] text-white/30 tabular-nums">
                  {formatDuration(track.duration)}
                </div>

                {/* Quick actions */}
                <div className="flex items-center justify-center shrink-0">
                  <a
                    href={track.deezerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 text-white/30 hover:text-deezer"
                    title="Open on Deezer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <audio
        ref={audioRef}
        onEnded={handleEnded}
        preload="auto"
      />
    </div>
  );
}
