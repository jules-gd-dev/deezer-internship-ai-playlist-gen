"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { PlaylistView } from "@/components/playlist-view";
import { WaveformLoader } from "@/components/waveform-loader";
import { GenreDropdown } from "@/components/genre-dropdown";
import { GENRES } from "@/types";
import { Wand2, Send, Plus, Check, Sparkles } from "lucide-react";
import type { EnrichedTrack } from "@/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  tracks?: EnrichedTrack[];
  loading?: boolean;
  error?: string;
  genre?: string;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<EnrichedTrack[]>([]);
  const [genre, setGenre] = useState("any");
  const [promptInput, setPromptInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleToggleSelectTrack = (track: EnrichedTrack) => {
    setSelectedTracks((prev) => {
      const exists = prev.find((t) => t.id === track.id);
      if (exists) {
        return prev.filter((t) => t.id !== track.id);
      } else {
        return [...prev, track];
      }
    });
  };

  const handleClearSelection = () => {
    setSelectedTracks([]);
  };

  const handleNewSession = () => {
    setMessages([]);
    setSelectedTracks([]);
    setPromptInput("");
    setGenre("any");
  };

  const handleGenerate = async (userPrompt: string) => {
    if (!userPrompt.trim() || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;

    // 1. Add the user message
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: userPrompt,
      genre: genre !== "any" ? genre : undefined,
    };

    // 2. Add a loading assistant message
    const assistantLoadingMsg: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: selectedTracks.length > 0 ? "Updating your playlist..." : "Generating your playlist...",
      loading: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantLoadingMsg]);
    setPromptInput("");
    setLoading(true);

    try {
      // Build history for the backend
      const historyPayload = messages.map((msg) => ({
        role: msg.role,
        content:
          msg.role === "assistant" && msg.tracks
            ? `Here is the playlist I generated for you:\n` +
              msg.tracks.map((t) => `- ${t.title} by ${t.artist}`).join("\n")
            : msg.content,
      }));

      const selectedPayload = selectedTracks.map((t) => ({
        title: t.title,
        artist: t.artist,
      }));

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
          genre,
          count: 15,
          history: historyPayload,
          selected_tracks: selectedPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      // Update the assistant message with the result
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                loading: false,
                content:
                  selectedTracks.length > 0
                    ? `I've updated your playlist. Kept your ${selectedTracks.length} selections and adjusted the vibe!`
                    : "Here is your playlist based on your prompt:",
                tracks: data.tracks,
              }
            : msg
        )
      );

      // Reset selection after update
      setSelectedTracks([]);
    } catch (err) {
      // Update the assistant message with the error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                loading: false,
                content: "Oops! Something went wrong.",
                error: err instanceof Error ? err.message : "Internal server error",
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (promptInput.trim()) {
      handleGenerate(promptInput.trim());
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col font-sans">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-white/[0.04] px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 49 48" className="w-6 h-6" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M41.0955 7.32313C41.5396 4.74914 42.1912 3.13054 42.913 3.12744H42.9146C44.2606 3.13208 45.3517 8.7454 45.3517 15.6759C45.3517 22.6063 44.259 28.2243 42.9115 28.2243C42.3591 28.2243 41.8494 27.2704 41.4389 25.6719C40.7903 31.5233 39.4443 35.5459 37.8862 35.5459C36.6806 35.5459 35.5986 33.1296 34.8722 29.3188C34.3762 36.5662 33.1279 41.708 31.6689 41.708C30.7533 41.708 29.9185 39.6705 29.3005 36.3529C28.5573 43.2014 26.8405 48 24.8382 48C22.836 48 21.1162 43.2029 20.376 36.3529C19.7625 39.6705 18.9278 41.708 18.0075 41.708C16.5486 41.708 15.3033 36.5662 14.8043 29.3188C14.0779 33.1296 12.999 35.5459 11.7903 35.5459C10.2337 35.5459 8.88621 31.5249 8.23763 25.6719C7.83017 27.2751 7.31741 28.2243 6.76497 28.2243C5.41745 28.2243 4.32478 22.6063 4.32478 15.6759C4.32478 8.7454 5.41745 3.12744 6.76497 3.12744C7.48833 3.12744 8.13538 4.75068 8.58405 7.32313C9.30283 2.88473 10.4703 0 11.7903 0C13.3576 0 14.7158 4.07975 15.3583 10.0038C15.987 5.69216 16.9408 2.94348 18.0091 2.94348C19.5061 2.94348 20.7789 8.34964 21.2505 15.8908C22.1371 12.0243 23.4205 9.59876 24.8413 9.59876C26.2621 9.59876 27.5455 12.0259 28.4306 15.8908C28.9037 8.34964 30.1749 2.94348 31.672 2.94348C32.7387 2.94348 33.691 5.69216 34.3228 10.0038C34.9637 4.07975 36.3219 0 37.8892 0C39.2047 0 40.3767 2.88628 41.0955 7.32313ZM0.837891 14.4417C0.837891 11.3436 1.45748 8.83142 2.22204 8.83142C2.9866 8.83142 3.60619 11.3436 3.60619 14.4417C3.60619 17.5397 2.9866 20.0519 2.22204 20.0519C1.45748 20.0519 0.837891 17.5397 0.837891 14.4417ZM46.0693 14.4417C46.0693 11.3436 46.6888 8.83142 47.4534 8.83142C48.218 8.83142 48.8376 11.3436 48.8376 14.4417C48.8376 17.5397 48.218 20.0519 47.4534 20.0519C46.6888 20.0519 46.0693 17.5397 46.0693 14.4417Z"
              fill="#A238FF"
            />
          </svg>
          <span className="text-white font-bold tracking-tight text-[15px]">Deezer Playlist Creator</span>
        </div>

        {hasMessages && (
          <button
            onClick={handleNewSession}
            className="flex items-center gap-1.5 px-3.5 h-9 rounded-full bg-white/[0.06] text-white/80 hover:bg-white/[0.12] hover:text-white text-xs font-bold transition-all cursor-pointer border border-white/[0.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            New Playlist
          </button>
        )}
      </header>

      {/* Main chat layout */}
      <main className="flex-1 w-full flex flex-col relative overflow-hidden">
        {!hasMessages ? (
          /* Landing/Empty State */
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
              Describe a vibe or moment, select a genre, and converse to refine your perfect tracklist.
            </p>

            {/* Input Form */}
            <form onSubmit={onSubmit} className="w-full mt-8 flex flex-col gap-3.5 bg-surface/30 border border-white/[0.04] p-5 rounded-2xl">
              <textarea
                ref={textareaRef}
                placeholder="Describe your mood, location, or activity..."
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
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
                  disabled={!promptInput.trim() || loading}
                  className={`
                    h-11 px-6 rounded-full text-sm font-bold tracking-tight
                    inline-flex items-center justify-center gap-2 shrink-0 transition-all select-none
                    ${promptInput.trim() && !loading
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
        ) : (
          /* Chat Console State */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable messages container */}
            <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 flex flex-col gap-6">
              <div className="max-w-3xl w-full mx-auto flex flex-col gap-6">
                {messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  const isLatest = index === messages.length - 1;
                  const isLatestAssistant = msg.role === "assistant" && (isLatest || (isLatest && loading) || (index === messages.length - 2 && messages[messages.length - 1].loading));

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full`}
                    >
                      {/* Bubble content */}
                      {isUser ? (
                        /* User message bubble */
                        <div className="flex flex-col items-end max-w-[85%]">
                          <div className="bg-deezer/15 border border-deezer/30 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-[14.5px] tracking-tight">
                            {msg.content}
                          </div>
                          {msg.genre && (
                            <span className="text-[10px] font-bold tracking-wide text-deezer uppercase mt-1.5 mr-1 bg-deezer/10 px-2 py-0.5 rounded-full">
                              {msg.genre}
                            </span>
                          )}
                        </div>
                      ) : (
                        /* Assistant message content */
                        <div className="flex gap-3.5 max-w-[95%] items-start w-full">
                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-full bg-deezer/15 border border-deezer/30 flex items-center justify-center shrink-0 mt-1">
                            <Sparkles className="w-4 h-4 text-deezer animate-pulse-soft" />
                          </div>

                          <div className="flex-1 flex flex-col min-w-0">
                            {/* Text message */}
                            <p className="text-[14.5px] text-white/95 leading-relaxed tracking-tight">
                              {msg.content}
                            </p>

                            {/* Error container */}
                            {msg.error && (
                              <div className="mt-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                                {msg.error}
                              </div>
                            )}

                            {/* Loading State animation */}
                            {msg.loading && (
                              <div className="mt-4 p-8 bg-surface/30 rounded-2xl border border-white/[0.02]">
                                <WaveformLoader />
                              </div>
                            )}

                            {/* Playlist presentation */}
                            {msg.tracks && msg.tracks.length > 0 && (
                              <div className="mt-4">
                                <PlaylistView
                                  tracks={msg.tracks}
                                  prompt={msg.content}
                                  selectable={isLatestAssistant}
                                  selectedTrackIds={selectedTracks.map((t) => t.id)}
                                  onToggleSelect={handleToggleSelectTrack}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Bottom floating chat input panel */}
            <div className="bg-gradient-to-t from-bg-primary via-bg-primary to-transparent pt-6 pb-6 px-4 sm:px-6 shrink-0 border-t border-white/[0.02]">
              <div className="max-w-2xl w-full mx-auto flex flex-col gap-3 bg-surface/30 border border-white/[0.04] p-3 rounded-2xl relative shadow-xl backdrop-blur-md">
                
                {/* Keep selection banner if tracks checked */}
                {selectedTracks.length > 0 && (
                  <div className="flex items-center justify-between px-3 py-2 bg-deezer/10 border border-deezer/30 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <div className="w-4.5 h-4.5 rounded-full bg-deezer flex items-center justify-center text-white">
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </div>
                      Keeping {selectedTracks.length} tracks
                    </div>
                    <button
                      onClick={handleClearSelection}
                      className="text-[11px] font-bold text-white/40 hover:text-white transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Input text form */}
                <form onSubmit={onSubmit} className="flex gap-2.5 items-center">
                  {/* Genre selector mini trigger */}
                  <div className="w-28 shrink-0">
                    <GenreDropdown
                      genres={GENRES}
                      selected={genre}
                      onSelect={setGenre}
                      disabled={loading}
                    />
                  </div>

                  {/* Input area */}
                  <input
                    type="text"
                    placeholder={
                      selectedTracks.length > 0
                        ? `How would you like to refine the vibe with these ${selectedTracks.length} tracks kept?`
                        : "Refine or redirect the playlist..."
                    }
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    disabled={loading}
                    className="flex-1 bg-white/[0.03] text-white placeholder-white/20 border border-white/[0.05] rounded-xl px-4 h-11 text-[13.5px] focus:outline-none focus:border-deezer focus:bg-white/[0.05] transition-colors"
                  />

                  {/* Submit icon button */}
                  <button
                    type="submit"
                    disabled={!promptInput.trim() || loading}
                    className={`
                      w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all select-none
                      ${promptInput.trim() && !loading
                        ? "bg-deezer text-white hover:bg-[#B25CFF] active:scale-[0.96] shadow-lg shadow-deezer/20 cursor-pointer"
                        : "bg-white/[0.04] text-white/20 cursor-not-allowed"
                      }
                    `}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
