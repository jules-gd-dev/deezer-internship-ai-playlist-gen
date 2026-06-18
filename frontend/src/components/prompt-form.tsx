"use client";

import { useState, FormEvent } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";

interface PromptFormProps {
  onSubmit: (prompt: string) => void;
  loading: boolean;
}

export function PromptForm({ onSubmit, loading }: PromptFormProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) onSubmit(prompt.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Textarea
        placeholder="Describe your perfect playlist…"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        disabled={loading}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading} disabled={!prompt.trim()}>
          {loading ? "Generating…" : "Generate Playlist"}
        </Button>
        {loading && (
          <span className="text-sm text-[#a0a0a0] animate-pulse">
            Asking the AI…
          </span>
        )}
      </div>
    </form>
  );
}
