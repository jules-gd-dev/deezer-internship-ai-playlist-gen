"use client";

import { useState } from "react";
import { PlaylistWizard } from "@/components/playlist-wizard";
import { PlaylistView } from "@/components/playlist-view";
import { WaveformLoader } from "@/components/waveform-loader";
import type { EnrichedTrack } from "@/types";

export default function Home() {
  const [tracks, setTracks] = useState<EnrichedTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  const generate = async (userPrompt: string, genre: string) => {
    setLoading(true);
    setError(null);
    setTracks([]);
    setPrompt(userPrompt);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt, genre }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setTracks(data.tracks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 flex flex-col">
        {/* Hero + Form — vertically centered when no results */}
        <div className={`flex flex-col items-center ${!tracks.length && !loading ? "flex-1 justify-center" : "pt-10 sm:pt-14"}`}>
          {/* Deezer logo */}
          <div className={`mb-6 ${loading ? "animate-pulse-fast" : ""}`}>
            <svg viewBox="0 0 49 48" className="w-12 h-12" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M41.0955 7.32313C41.5396 4.74914 42.1912 3.13054 42.913 3.12744H42.9146C44.2606 3.13208 45.3517 8.7454 45.3517 15.6759C45.3517 22.6063 44.259 28.2243 42.9115 28.2243C42.3591 28.2243 41.8494 27.2704 41.4389 25.6719C40.7903 31.5233 39.4443 35.5459 37.8862 35.5459C36.6806 35.5459 35.5986 33.1296 34.8722 29.3188C34.3762 36.5662 33.1279 41.708 31.6689 41.708C30.7533 41.708 29.9185 39.6705 29.3005 36.3529C28.5573 43.2014 26.8405 48 24.8382 48C22.836 48 21.1162 43.2029 20.376 36.3529C19.7625 39.6705 18.9278 41.708 18.0075 41.708C16.5486 41.708 15.3033 36.5662 14.8043 29.3188C14.0779 33.1296 12.999 35.5459 11.7903 35.5459C10.2337 35.5459 8.88621 31.5249 8.23763 25.6719C7.83017 27.2751 7.31741 28.2243 6.76497 28.2243C5.41745 28.2243 4.32478 22.6063 4.32478 15.6759C4.32478 8.7454 5.41745 3.12744 6.76497 3.12744C7.48833 3.12744 8.13538 4.75068 8.58405 7.32313C9.30283 2.88473 10.4703 0 11.7903 0C13.3576 0 14.7158 4.07975 15.3583 10.0038C15.987 5.69216 16.9408 2.94348 18.0091 2.94348C19.5061 2.94348 20.7789 8.34964 21.2505 15.8908C22.1371 12.0243 23.4205 9.59876 24.8413 9.59876C26.2621 9.59876 27.5455 12.0259 28.4306 15.8908C28.9037 8.34964 30.1749 2.94348 31.672 2.94348C32.7387 2.94348 33.691 5.69216 34.3228 10.0038C34.9637 4.07975 36.3219 0 37.8892 0C39.2047 0 40.3767 2.88628 41.0955 7.32313ZM0.837891 14.4417C0.837891 11.3436 1.45748 8.83142 2.22204 8.83142C2.9866 8.83142 3.60619 11.3436 3.60619 14.4417C3.60619 17.5397 2.9866 20.0519 2.22204 20.0519C1.45748 20.0519 0.837891 17.5397 0.837891 14.4417ZM46.0693 14.4417C46.0693 11.3436 46.6888 8.83142 47.4534 8.83142C48.218 8.83142 48.8376 11.3436 48.8376 14.4417C48.8376 17.5397 48.218 20.0519 47.4534 20.0519C46.6888 20.0519 46.0693 17.5397 46.0693 14.4417Z"
                fill="#A238FF"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-[-0.04em] leading-[1.05] font-sans text-center">
            Turn any text
            <br />
            <span className="text-deezer">into a playlist</span>
          </h1>
          <p className="text-base sm:text-lg text-text-secondary mt-5 max-w-md mx-auto leading-relaxed text-center">
            Describe a mood, a memory, or a moment — AI turns your words into
            the perfect tracklist.
          </p>

          {/* Wizard */}
          <div className="max-w-2xl w-full mt-10">
            <PlaylistWizard onGenerate={generate} loading={loading} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto w-full mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="max-w-2xl mx-auto w-full mt-8">
            <div className="card p-10">
              <WaveformLoader />
            </div>
          </div>
        )}

        {/* Results */}
        {tracks.length > 0 && !loading && (
          <div className="max-w-2xl mx-auto w-full mt-10 pb-16">
            <PlaylistView tracks={tracks} prompt={prompt} />
          </div>
        )}
      </main>
    </div>
  );
}
