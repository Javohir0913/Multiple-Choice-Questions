export function ProgressBar({ current, total }: { current: number; total: number }) {
  const percent = total > 0 ? Math.min(100, Math.round(((current - 1) / total) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm text-gray-500 mb-1">
        <span>
          Savol {Math.min(current, total)} / {total}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
