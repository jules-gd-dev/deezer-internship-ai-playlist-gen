"use client";

import { useState, FormEvent, useRef } from "react";
import { Textarea } from "./ui/textarea";
import { GenreDropdown } from "./genre-dropdown";
import { Wand2 } from "lucide-react";
import { GENRES } from "@/types";

interface PlaylistWizardProps {
  onGenerate: (prompt: string, genre: string) => void;
  loading: boolean;
}

export function PlaylistWizard({ onGenerate, loading }: PlaylistWizardProps) {
  const [genre, setGenre] = useState("any");
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !loading) {
      onGenerate(prompt.trim(), genre);
    }
  };

  const hasPrompt = prompt.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Textarea
        ref={textareaRef}
        placeholder="Describe the playlist you want…"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        disabled={loading}
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Genre dropdown */}
        <div className="flex-1">
          <GenreDropdown
            genres={GENRES}
            selected={genre}
            onSelect={setGenre}
            disabled={loading}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!hasPrompt || loading}
          className={`
            h-12 px-7 rounded-xl text-[15px] font-bold tracking-normal
            inline-flex items-center justify-center gap-2.5
            shrink-0 transition-all duration-200 select-none
            ${hasPrompt && !loading
              ? "bg-deezer text-white hover:bg-[#B25CFF] active:scale-[0.97] active:bg-[#8E2DE2] shadow-lg shadow-deezer/25 cursor-pointer"
              : "bg-white/[0.06] text-white/25 cursor-not-allowed"
            }
          `}
        >
          {loading ? (
            <>
              <div className="spinner-gradient" />
              Generating…
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" strokeWidth={2.5} />
              Generate playlist
            </>
          )}
        </button>
      </div>
    </form>
  );
}
