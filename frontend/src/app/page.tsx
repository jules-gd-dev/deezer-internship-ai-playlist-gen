"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { PlaylistView } from "@/components/playlist-view";
import { WaveformLoader } from "@/components/waveform-loader";
import { GenreDropdown } from "@/components/genre-dropdown";
import { GENRES } from "@/types";
import { Wand2, Plus } from "lucide-react";
import type { EnrichedTrack } from "@/types";

export default function Home() {
  const [tracks, setTracks] = useState<EnrichedTrack[]>([]);
  const [playlistName, setPlaylistName] = useState("");
  const [genre, setGenre] = useState("any");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const hasResult = tracks.length > 0;

  const handleNewSession = () => {
    setTracks([]);
    setPlaylistName("");
    setPrompt("");
    setGenre("any");
  };

  const handleGenerate = async (userPrompt: string) => {
    if (!userPrompt.trim() || loading) return;

    setLoading(true);
    setPrompt("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
          genre,
          count: 15,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      setTracks(data.tracks);
      setPlaylistName(data.name || "");
    } catch (err) {
      console.error("Generation failed:", err);
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

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col font-sans">
      <main className="flex-1 w-full flex flex-col">
        {!hasResult && !loading ? (
          /* ── Landing / Empty State ── */
          <div className="flex-1 max-w-2xl w-full mx-auto px-6 flex flex-col justify-center items-center -mt-8">
            <div className="mb-6">
              <svg viewBox="0 0 49 48" className="w-16 h-16" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M41.0955 7.32313C41.5396 4.74914 42.1912 3.13054 42.913 3.12744H42.9146C44.2606 3.13208 45.3517 8.7454 45.3517 15.6759C45.3517 22.6063 44.259 28.2243 42.9115 28.2243C42.3591 28.2243 41.8494 27.2704 41.4389 25.6719C40.7903 31.5233 39.4443 35.5459 37.8862 35.5459C36.6806 35.5459 35.5986 33.1296 34.8722 29.3188C34.3762 36.5662 33.1279 41.708 31.6689 41.708C30.7533 41.708 29.9185 39.6705 29.3005 36.3529C28.5573 43.2014 26.8405 48 24.8382 48C22.836 48 21.1162 43.2029 20.376 36.3529C19.7625 39.6705 18.9278 41.708 18.0075 41.708C16.5486 41.708 15.3033 36.5662 14.8043 29.3188C14.0779 33.1296 12.999 35.5459 11.7903 35.5459C10.2337 35.5459 8.88621 31.5249 8.23763 25.6719C7.83017 27.2751 7.31741 28.2243 6.76497 28.2243C5.41745 28.2243 4.32478 22.6063 4.32478 15.6759C4.32478 8.7454 5.41745 3.12744 6.76497 3.12744C7.48833 3.12744 8.13538 4.75068 8.58405 7.32313C9.30283 2.88473 10.4703 0 11.7903 0C13.3576 0 14.7158 4.07975 15.3583 10.0038C15.987 5.69216 16.9408 2.94348 18.0091 2.94348C19.5061 2.94348 20.7789 8.34964 21.2505 15.8908C22.1371 12.0243 23.4205 9.59876 24.8413 9.59876C26.2621 9.59876 27.5455 12.0259 28.4306 15.8908C28.9037 8.34964 30.1749 2.94348 31.672 2.94348C32.7387 2.94348 33.691 5.69216 34.3228 10.0038C34.9637 4.07975 36.3219 0 37.8892 0C39.2047 0 40.3767 2.88628 41.0955 7.32313ZM0.837891 14.4417C0.837891 11.3436 1.45748 8.83142 2.22204 8.83142C2.9866 8.83142 3.60619 11.3436 3.60619 14.4417C3.60619 17.5397 2.9866 20.0519 2.22204 20.0519C1.45748 20.0519 0.837891 17.5397 0.837891 14.4417ZM46.0693 14.4417C46.0693 11.3436 46.6888 8.83142 47.4534 8.83142C48.218 8.83142 48.8376 11.3436 48.8376 14.4417C48.8376 17.5397 48.218 20.0519 47.4534 20.0519C46.6888 20.0519 46.0693 17.5397 46.0693 14.4417Z"
                  fill="#A238FF"
                />
              </svg>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-[-0.04em] leading-none text-center">
              Turn any text
              <br />
              <span className="text-deezer">into a playlist</span>
            </h1>
            <p className="text-sm sm:text-base text-text-secondary mt-4 max-w-sm text-center">
              Describe a vibe or moment, select a genre, and let AI craft your perfect tracklist.
            </p>

            <form onSubmit={onSubmit} className="w-full mt-8 flex flex-col gap-3.5 bg-surface/30 border border-white/[0.04] p-5 rounded-2xl">
              <textarea
                ref={textareaRef}
                placeholder="Describe your mood, location, or activity..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                disabled={loading}
                className="w-full bg-white/[0.03] text-white placeholder-white/20 border border-white/[0.05] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-deezer focus:bg-white/[0.05] resize-none transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e);
                  }
                }}
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1">
                  <GenreDropdown
                    genres={GENRES}
                    selected={genre}
                    onSelect={setGenre}
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!prompt.trim() || loading}
                  className={`
                    h-11 px-6 rounded-lg text-sm font-bold tracking-tight
                    inline-flex items-center justify-center gap-2 shrink-0 transition-all select-none
                    ${prompt.trim() && !loading
                      ? "bg-deezer text-white hover:bg-[#B25CFF] active:scale-[0.98] shadow-lg shadow-deezer/20 cursor-pointer"
                      : "bg-white/[0.05] text-white/20 cursor-not-allowed"
                    }
                  `}
                >
                  <Wand2 className="w-4 h-4" />
                  Generate
                </button>
              </div>
            </form>
          </div>
        ) : loading && tracks.length === 0 ? (
          /* ── Full-screen Loader ── */
          <WaveformLoader />
        ) : (
          /* ── Result ── */
          <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
            <PlaylistView tracks={tracks} name={playlistName} />

            <div className="flex justify-center">
              <button
                onClick={handleNewSession}
                className="flex items-center gap-2 px-5 h-10 rounded-lg bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white text-sm font-bold transition-all cursor-pointer border border-white/[0.04]"
              >
                <Plus className="w-4 h-4" />
                New Playlist
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
