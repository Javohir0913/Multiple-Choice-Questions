export function Timer({ secondsLeft, total }: { secondsLeft: number; total: number }) {
  const mm = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");
  const urgent = total > 0 && secondsLeft <= Math.min(10, total);

  return (
    <div
      className={`text-lg font-mono font-semibold rounded-xl px-3 py-1.5 border ${
        urgent
          ? "border-red-400 text-red-500 bg-red-50 dark:bg-red-950/30"
          : "border-gray-300 dark:border-gray-700"
      }`}
    >
      {mm}:{ss}
    </div>
  );
}
