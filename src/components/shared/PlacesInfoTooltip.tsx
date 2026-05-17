import { SPLIT_PRESETS } from '@/lib/rules/defaults';

export function PlacesInfoTooltip() {
  const top2 = SPLIT_PRESETS[2].join('/');
  const top3 = SPLIT_PRESETS[3].join('/');
  const top4 = SPLIT_PRESETS[4].join('/');
  const top5 = SPLIT_PRESETS[5].join('/');

  return (
    <div className="group relative inline-flex">
      <button
        type="button"
        aria-label="Payout depth rules"
        className="text-text-dim hover:text-teal text-xs w-5 h-5 rounded-full border border-border-accent flex items-center justify-center transition-colors"
      >
        ?
      </button>
      <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity absolute left-0 top-full mt-2 z-30 bg-card-highlight border border-border-accent rounded-lg p-3 text-xs shadow-xl whitespace-nowrap">
        <div className="font-semibold text-text mb-2">Payout depth by field size</div>
        <div className="space-y-1 text-text-muted">
          <div><span className="text-text">Under 32 players</span> → Top 2 ({top2}%)</div>
          <div><span className="text-text">32–39 players</span> → Top 3 ({top3}%)</div>
          <div><span className="text-text">40–47 players</span> → Top 4 ({top4}%)</div>
          <div><span className="text-text">48+ players</span> → Top 5 ({top5}%)</div>
        </div>
      </div>
    </div>
  );
}
