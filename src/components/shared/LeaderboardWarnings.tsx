/** Amber callout listing leaderboards the export should have had but didn't. */
export function LeaderboardWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="bg-amber/10 border-2 border-amber/50 rounded-lg px-4 py-3 space-y-2">
      <div className="text-amber font-bold">
        ⚠️ Check the leaderboard export — {warnings.length} problem{warnings.length === 1 ? '' : 's'} found
      </div>
      <ul className="list-disc pl-5 space-y-1 text-sm text-amber">
        {warnings.map(w => <li key={w}>{w}</li>)}
      </ul>
    </div>
  );
}
