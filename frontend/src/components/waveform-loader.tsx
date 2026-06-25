import { useI18n } from "@/lib/i18n";

export function WaveformLoader() {
  const { t } = useI18n();

  // Purple brand oblongs
  const bars = [
    { delay: "0.0s", color: "bg-deezer", height: "h-14" },
    { delay: "0.12s", color: "bg-deezer", height: "h-20" },
    { delay: "0.24s", color: "bg-deezer", height: "h-24" },
    { delay: "0.36s", color: "bg-deezer", height: "h-28" },
    { delay: "0.48s", color: "bg-deezer", height: "h-32" },
    { delay: "0.6s", color: "bg-deezer", height: "h-36" },
    { delay: "0.48s", color: "bg-deezer", height: "h-32" },
    { delay: "0.36s", color: "bg-deezer", height: "h-28" },
    { delay: "0.24s", color: "bg-deezer", height: "h-24" },
    { delay: "0.12s", color: "bg-deezer", height: "h-20" },
    { delay: "0.0s", color: "bg-deezer", height: "h-14" },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-10">
      {/* Animated Equalizer Wave */}
      <div className="flex items-end gap-2 sm:gap-2.5 h-40">
        {bars.map((bar, i) => (
          <div
            key={i}
            className={`w-2.5 sm:w-3.5 rounded-full ${bar.color} ${bar.height} origin-bottom animate-eq-loader`}
            style={{ animationDelay: bar.delay }}
          />
        ))}
      </div>

      {/* Loading Text */}
      <p className="text-4xl sm:text-5xl font-extrabold text-white tracking-normal font-sans">
        {t("generating")}
        <span className="animate-bounce-dot inline-block ml-0.5">.</span>
        <span className="animate-bounce-dot inline-block ml-0.5" style={{ animationDelay: "0.15s" }}>.</span>
        <span className="animate-bounce-dot inline-block ml-0.5" style={{ animationDelay: "0.3s" }}>.</span>
      </p>
    </div>
  );
}
