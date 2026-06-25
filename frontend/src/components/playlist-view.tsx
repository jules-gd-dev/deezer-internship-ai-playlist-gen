"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Play, Pause, ExternalLink, Clock, Music, Trash2, GripVertical } from "lucide-react";
import type { EnrichedTrack } from "@/types";
import { useI18n } from "@/lib/i18n";

interface PlaylistViewProps {
  tracks: EnrichedTrack[];
  name?: string;
  selectable?: boolean;
  selectedTrackIds?: number[];
  onToggleSelect?: (track: EnrichedTrack) => void;
  onDeleteTrack?: (trackId: number) => void;
  onReorderTracks?: (fromIndex: number, toIndex: number) => void;
}

export function PlaylistView({
  tracks,
  name,
  selectable = false,
  selectedTrackIds = [],
  onToggleSelect,
  onDeleteTrack,
  onReorderTracks,
}: PlaylistViewProps) {
  const { t } = useI18n();
  const [playingTrack, setPlayingTrack] = useState<EnrichedTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const displayName = (() => {
    if (!name) return t("title");
    const trimmed = name.trim().replace(/^["']|["']$/g, "");
    if (trimmed.length <= 40) return trimmed;
    for (const sep of [":", " — ", " - ", ", ", " (", " ["]) {
      const idx = trimmed.indexOf(sep);
      if (idx > 10 && idx <= 40) return trimmed.slice(0, idx);
    }
    const cut = trimmed.slice(0, 40);
    return cut.includes(" ") ? cut.split(" ").slice(0, -1).join(" ") + "…" : cut + "…";
  })();

  // Cover collage state: stays fixed during reordering of the same playlist
  const [collageCovers, setCollageCovers] = useState<string[]>([]);
  const trackIdsKey = tracks.map((t) => t.id).sort().join(",");

  useEffect(() => {
    const unique = tracks
      .map((t) => t.albumCover)
      .filter((cover, index, self) => cover && self.indexOf(cover) === index)
      .slice(0, 4);
    setCollageCovers(unique);
  }, [trackIdsKey]);

  // Deterministic check to pick solid white or solid black watermark for the cover art
  const isLogoWhite = (() => {
    if (!collageCovers.length) return true;
    const key = collageCovers[0] || "";
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 2 === 0;
  })();

  // Total duration calculation
  const totalSeconds = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const formatTotalDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) {
      return `${h} ${t("duration_hour")} ${m} ${t("duration_min")}`;
    }
    return `${m} ${t("duration_min")}`;
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

  // Dynamic grid classes
  const gridClass = selectable
    ? "grid grid-cols-[20px_24px_30px_1fr_45px] sm:grid-cols-[20px_24px_40px_1fr_1fr_50px_50px]"
    : "grid grid-cols-[20px_30px_1fr_45px] sm:grid-cols-[20px_40px_1fr_1fr_50px_50px]";

  // Drag and drop event handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
    
    // Set dragged index in a setTimeout so the browser takes a snapshot of the fully visible row first
    setTimeout(() => {
      setDraggedIndex(index);
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      if (onReorderTracks) {
        onReorderTracks(draggedIndex, dragOverIndex);
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Playlist Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-surface/40 border border-white/[0.04] p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 sm:gap-8 shadow-2xl backdrop-blur-md">
        {/* Cover Art Collage */}
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shrink-0 shadow-lg bg-white/[0.02] border border-white/[0.08] flex items-center justify-center">
          {collageCovers.length >= 4 ? (
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
              {collageCovers.map((cover, i) => (
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
          ) : collageCovers.length > 0 ? (
            <div className="relative w-full h-full">
              <Image
                src={collageCovers[0]}
                alt="Playlist cover"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <Music className="w-12 h-12 text-white/10" />
          )}

          {/* Deezer Logo Watermark Overlay */}
          <div className={`absolute bottom-2.5 right-2.5 select-none pointer-events-none ${
            isLogoWhite 
              ? "text-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.85)]" 
              : "text-black drop-shadow-[0_1.5px_3px_rgba(255,255,255,0.85)]"
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="56" height="9" viewBox="0 0 127 20" fill="none">
              <path fill="currentColor" fillRule="evenodd" d="M0 0h10.065c6.232 0 10.639 4.13 10.639 10s-4.407 10-10.639 10H0V0Zm7.823 14.597h1.825c1.956 0 2.999-1.298 2.999-4.597 0-3.299-1.043-4.597-3-4.597H7.824v9.194ZM40.153 20H23.62V0h16.532v5.403h-8.735v2.311h8.213v4.416h-8.213v2.467h8.735V20Zm20.31 0H43.93V0h16.532v5.403h-8.736v2.311h8.214v4.416h-8.214v2.467h8.736V20Zm66.159 0c-1.126-3.058-2.702-6.321-4.821-9.979 2.479-.724 3.961-2.28 3.961-4.67 0-3.637-3.364-5.351-8.683-5.351h-10.952v20h7.823v-8.273c1.738 2.916 3.018 5.667 3.859 8.273h8.813ZM113.95 8.935V5.403h2.712c1.147 0 1.799.623 1.799 1.766s-.652 1.766-1.799 1.766h-2.712ZM102.328 20H85.797V0h16.531v5.403h-8.735v2.311h8.214v4.416h-8.214v2.467h8.735V20ZM64.397 5.403h8.071c-3.349 2.729-6.105 5.82-8.228 9.194V20h17.758v-5.403h-8.876c2.034-2.947 4.876-5.882 8.876-9.194V0H64.397v5.403Z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Playlist metadata */}
        <div className="flex-1 text-center md:text-left min-w-0 flex flex-col justify-end">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-normal leading-tight truncate font-sans">
            {displayName}
          </h2>
          <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1 text-xs text-white/40 font-medium">
            <span className="text-white/60">{tracks.length} {t("tracks")}</span>
            <span>•</span>
            <span>{formatTotalDuration(totalSeconds)}</span>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <button
              onClick={playAll}
              disabled={tracks.length === 0}
              className="h-11 px-6 rounded-lg bg-deezer text-white font-bold text-sm tracking-normal flex items-center gap-2 hover:bg-[#B25CFF] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-deezer/20"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" fill="currentColor" />
                  {t("pause_preview")}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                  {t("preview_playlist")}
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
          <span className="w-5"></span> {/* Grip handle empty cell */}
          {selectable && <span className="text-center"></span>}
          <span className="text-center">#</span>
          <span>{t("track_col")}</span>
          <span className="hidden sm:block">{t("album_col")}</span>
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

            // Compute shift offset dynamically via inline style to support drag visual space opening
            let transformStyle = {};
            if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
              if (i === draggedIndex) {
                // The item being dragged remains hidden at its source index
                transformStyle = {
                  transform: "translateY(0px)",
                };
              } else if (draggedIndex < dragOverIndex) {
                // Dragging down: adjacent tracks slide UP to fill the space
                if (i > draggedIndex && i <= dragOverIndex) {
                  transformStyle = {
                    transform: "translateY(-66px)",
                    transition: "transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                    willChange: "transform",
                  };
                }
              } else {
                // Dragging up: adjacent tracks slide DOWN to fill the space
                if (i >= dragOverIndex && i < draggedIndex) {
                  transformStyle = {
                    transform: "translateY(66px)",
                    transition: "transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                    willChange: "transform",
                  };
                }
              }
            } else {
              transformStyle = {
                transform: "translateY(0px)",
                transition: "transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                willChange: "transform",
              };
            }

            return (
              <div
                key={track.id}
                onClick={() => track.previewUrl && togglePlay(track)}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                style={transformStyle}
                className={`${gridClass} gap-4 items-center px-4 py-3 rounded-xl select-none transition-opacity duration-150 ${
                  isCurrent || isSelected ? "" : "hover:bg-white/[0.03]"
                } ${track.previewUrl ? "cursor-pointer" : ""} ${
                  draggedIndex === i ? "opacity-0 pointer-events-none scale-95" : ""
                }`}
              >
                {/* Grip Handle */}
                <div className="flex items-center justify-center text-white/10 group-hover:text-white/45 cursor-grab active:cursor-grabbing transition-colors w-5 h-8">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>

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
                <div className="flex items-center justify-center gap-1.5 shrink-0">
                  {onDeleteTrack && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTrack(track.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 text-white/30 hover:text-red-400 cursor-pointer"
                      title={t("delete_track")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <a
                    href={track.deezerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 text-white/30 hover:text-deezer"
                    title={t("open_on_deezer")}
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
