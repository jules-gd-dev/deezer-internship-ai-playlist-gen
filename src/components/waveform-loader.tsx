"use client";

const BAR_WIDTH = 6;

const barHeights = [
  15, 22, 32, 45, 58, 70, 82, 92, 98, 92, 82, 70, 58, 45, 32, 22, 15,
];

export function WaveformLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-6">
      <div className="flex items-end gap-[3px] h-20 sm:h-24">
        {barHeights.map((h, i) => {
          const duration = 0.9 + Math.sin(i * 0.5) * 0.2;
          return (
            <div
              key={i}
              className="wave-bar rounded-sm bg-deezer"
              style={{
                height: h + "%",
                width: BAR_WIDTH + "px",
                opacity: 0.9 - i * 0.01,
                transformOrigin: "bottom",
                animationDelay: i * 0.07 + "s",
                animationDuration: duration + "s",
              }}
            />
          );
        })}
      </div>

      <div className="text-center">
        <p className="text-base font-bold text-white tracking-tight">
          Generating your playlist
        </p>
        <p className="text-sm text-white/50 mt-1">
          AI is crafting tracks just for you
        </p>
      </div>
    </div>
  );
}
