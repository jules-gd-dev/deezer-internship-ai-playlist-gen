"use client";

export function WaveformLoader() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2">
      <p className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight">
        Génération
        <span className="animate-bounce-dot inline-block ml-0.5">.</span>
        <span className="animate-bounce-dot inline-block ml-0.5" style={{ animationDelay: "0.15s" }}>.</span>
        <span className="animate-bounce-dot inline-block ml-0.5" style={{ animationDelay: "0.3s" }}>.</span>
      </p>
    </div>
  );
}
