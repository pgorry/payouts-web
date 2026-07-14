import type { PlayerCharge } from '@/types';

/**
 * Marks players who didn't buy the full entry, so their smaller charge reads as
 * intentional rather than a mistake.
 */
export function TierBadge({ tier }: { tier: PlayerCharge['tier'] }) {
  if (tier === 'full') return null;
  const label = tier === 'kp-only' ? 'KP only' : 'Open play';
  return (
    <span className="ml-2 align-middle text-[10px] uppercase tracking-wider text-amber border border-amber/40 rounded px-1.5 py-0.5">
      {label}
    </span>
  );
}
