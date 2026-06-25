"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { PlaylistView } from "@/components/playlist-view";
import { WaveformLoader } from "@/components/waveform-loader";
import { GenreDropdown } from "@/components/genre-dropdown";
import { Header } from "@/components/header";
import { GENRES } from "@/types";
import { Wand2, Plus, Music } from "lucide-react";
import type { EnrichedTrack } from "@/types";
import { useI18n } from "@/lib/i18n";

const SUGGESTIONS = [
  {
    fr: "Sélection acoustique chaleureuse pour un jour de pluie",
    en: "Warm acoustic selections for a rainy day",
    genre: "indie",
  },
  {
    fr: "Musique électronique rythmée pour coder en fin de soirée",
    en: "Deep electronic beats for late night coding focus",
    genre: "electronic",
  },
  {
    fr: "Classiques du hip-hop à écouter en roadtrip",
    en: "Golden era hip-hop classics for a highway drive",
    genre: "hiphop",
  },
  {
    fr: "Chansons acoustiques françaises chill et mélancoliques",
    en: "Chill and melancholic French acoustic songs",
    genre: "french",
  },
];

interface HistoryEntry {
  id: string;
  name: string;
  prompt: string;
  genre: string;
  tracks: EnrichedTrack[];
  timestamp: number;
}

export default function Home() {
  const { t, locale } = useI18n();
  const [tracks, setTracks] = useState<EnrichedTrack[]>([]);
  const [playlistName, setPlaylistName] = useState("");
  const [genre, setGenre] = useState("any");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    console.log("[Deezer Playlist Gen] Loaded version 2.0.0. Active Fonts: Inter (sans-serif). Layout: Pro Curation Studio.");

    // Load history from localStorage
    const saved = localStorage.getItem("playlist_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse playlist history", e);
      }
    }
  }, []);

  const saveToHistory = (name: string, pmt: string, gnr: string, trks: EnrichedTrack[]) => {
    const newEntry: HistoryEntry = {
      id: Math.random().toString(36).substring(2, 9),
      name: name || pmt || "Unnamed Playlist",
      prompt: pmt,
      genre: gnr,
      tracks: trks,
      timestamp: Date.now()
    };
    setHistory(prev => {
      const updated = [newEntry, ...prev.filter(item => item.prompt !== pmt)].slice(0, 10);
      localStorage.setItem("playlist_history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteTrack = (trackId: number) => {
    setTracks(prev => {
      const updated = prev.filter(t => t.id !== trackId);

      setHistory(prevHistory => {
        const updatedHistory = prevHistory.map(entry => {
          if (entry.prompt === prompt) {
            return { ...entry, tracks: entry.tracks.filter(t => t.id !== trackId) };
          }
          return entry;
        });
        localStorage.setItem("playlist_history", JSON.stringify(updatedHistory));
        return updatedHistory;
      });

      return updated;
    });
  };

  const handleLoadHistory = (entry: HistoryEntry) => {
    if (loading) return;
    setTracks(entry.tracks);
    setPlaylistName(entry.name);
    setPrompt(entry.prompt);
    setGenre(entry.genre);
    setError(null);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("playlist_history");
  };

  const handleNewSession = () => {
    setTracks([]);
    setPlaylistName("");
    setPrompt("");
    setGenre("any");
    setError(null);
  };

  const handleSuggestionClick = (s: typeof SUGGESTIONS[0]) => {
    if (loading) return;
    setPrompt(locale === "fr" ? s.fr : s.en);
    setGenre(s.genre);
    setError(null);
    textareaRef.current?.focus();
  };

  const handleGenerate = async (userPrompt: string) => {
    if (!userPrompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setTracks([]); // Clear previous playlist tracks so the loader shows up immediately
    setPlaylistName(""); // Reset playlist name

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
          genre,
          count: 20,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || data.message || "Generation failed");
      }

      setTracks(data.tracks);
      setPlaylistName(data.name || "");
      saveToHistory(data.name || "", userPrompt, genre, data.tracks);
    } catch (err: any) {
      console.error("Generation failed:", err);
      setError(err.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      handleGenerate(prompt.trim());
    }
  };

  const hasResult = tracks.length > 0;

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col font-body">
      {/* Sticky Header */}
      <Header />

      {/* Main Workspace Layout */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col md:flex-row md:items-start transition-all duration-700 ease-in-out relative ${(loading || hasResult) ? "gap-6 lg:gap-8" : "gap-0"}`}>
        
        {/* Left Column: Playlist Creator Controls */}
        <div className={`transition-all duration-700 ease-in-out shrink-0 flex flex-col h-fit ${
          (loading || hasResult)
            ? "w-full md:sticky md:top-[109px] md:max-w-[350px] lg:max-w-[380px] md:translate-y-0"
            : "w-full max-w-2xl mx-auto md:translate-y-16"
        }`}>
          {/* Brand Heading - Only visible when centered/idle */}
          <div className={`transition-all duration-500 ease-in-out text-center space-y-3 ${
            (loading || hasResult)
              ? "opacity-0 h-0 overflow-hidden pointer-events-none scale-95"
              : "opacity-100 h-auto scale-100 mb-6"
          }`}>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              {t("landing_title_1")}{" "}
              <span className="text-deezer">
                {t("landing_title_2")}
              </span>
            </h1>
            <p className="text-sm sm:text-base text-white/50 max-w-md mx-auto leading-relaxed mt-2">
              {t("landing_subtitle")}
            </p>
          </div>

          <div className="bg-[#121215] border border-white/[0.06] p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3.5 flex items-start gap-2.5 animate-fade-in">
                <span className="font-semibold">{error}</span>
              </div>
            )}
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <textarea
                ref={textareaRef}
                placeholder={t("placeholder")}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                disabled={loading}
                className="w-full bg-[#1A1A1E] text-white placeholder-white/30 border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-deezer/60 focus:bg-[#202025] resize-none transition-all duration-200"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e);
                  }
                }}
              />

              <div className="flex flex-col gap-3">
                <GenreDropdown
                  genres={GENRES}
                  selected={genre}
                  onSelect={setGenre}
                  disabled={loading}
                />

                <button
                  type="submit"
                  suppressHydrationWarning={true}
                  disabled={!prompt.trim() || loading}
                  className={`
                    w-full h-11 rounded-lg text-sm font-bold tracking-wide
                    inline-flex items-center justify-center gap-2 transition-all duration-200 select-none cursor-pointer
                    ${prompt.trim() && !loading
                      ? "bg-deezer text-white hover:bg-[#B25CFF] active:scale-[0.98]"
                      : "bg-[#1C1C20] text-white/20 cursor-not-allowed border border-white/[0.02]"
                    }
                  `}
                >
                  <Wand2 className="w-4 h-4" />
                  {t("generate")}
                </button>
              </div>
            </form>
          </div>

          {/* Prompt suggestions panel for quick starting */}
          {!(loading || hasResult) && (
            <div className="mt-5 bg-[#121215]/50 border border-white/[0.04] p-5 rounded-2xl flex flex-col gap-3">
              <h3 className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/30">
                {t("inspiration_title")}
              </h3>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(s)}
                    disabled={loading}
                    className="text-left text-[13px] text-white/55 hover:text-white bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] rounded-lg p-2.5 transition-all cursor-pointer duration-150 active:scale-[0.99] disabled:opacity-50"
                  >
                    {locale === "fr" ? s.fr : s.en}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* History Panel */}
          {history.length > 0 && (
            <div className="mt-5 bg-[#121215]/50 border border-white/[0.04] p-5 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                <h3 className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/30">
                  {t("history_title")}
                </h3>
                <button
                  onClick={handleClearHistory}
                  className="text-[10px] text-white/30 hover:text-red-400 font-bold transition-all cursor-pointer"
                >
                  {t("clear_history")}
                </button>
              </div>
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => handleLoadHistory(entry)}
                    className="text-left text-[13px] text-white/55 hover:text-white bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] rounded-lg p-2.5 transition-all cursor-pointer duration-150 active:scale-[0.99] flex items-center justify-between group"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-semibold text-white/80 truncate group-hover:text-white transition-all">
                        {entry.name}
                      </span>
                      <span className="text-[11px] text-white/30 truncate mt-0.5">
                        {entry.prompt}
                      </span>
                    </div>
                    <span className="text-[11px] text-deezer font-semibold shrink-0">
                      {entry.tracks.length} {t("tracks")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Output Playlist workspace / Loader */}
        <div className={`transition-all duration-700 ease-in-out flex flex-col ${
          (loading || hasResult)
            ? "flex-grow min-w-0 opacity-100 translate-x-0 scale-100"
            : "w-0 h-0 opacity-0 overflow-hidden pointer-events-none border-none p-0 m-0 translate-x-8 scale-95"
        }`}>
          {loading ? (
            <div className="flex-grow flex items-center justify-center">
              <WaveformLoader />
            </div>
          ) : tracks.length > 0 ? (
            <div className="flex-grow flex flex-col justify-between gap-6">
              <PlaylistView tracks={tracks} name={playlistName} onDeleteTrack={handleDeleteTrack} />
              
              <div className="flex justify-end pt-4 border-t border-white/[0.04] shrink-0">
                <button
                  onClick={handleNewSession}
                  className="flex items-center gap-2 px-4 h-9 rounded-lg bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white text-xs font-bold transition-all cursor-pointer border border-white/[0.04]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t("new_playlist")}
                </button>
              </div>
            </div>
          ) : (
            /* Elegant Workspace Empty State (Fallback/Legacy) */
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02] mb-4 text-white/30">
                <Music className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                {t("empty_workspace_title")}
              </h3>
              <p className="text-[13px] text-white/40 max-w-md leading-relaxed">
                {t("empty_workspace_desc")}
              </p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
