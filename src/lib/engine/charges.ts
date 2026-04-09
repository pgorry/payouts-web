import type {
  Player,
  DeuceResult,
  KPResult,
  SlotResult,
  ParPointResult,
  PlayerCharge,
} from '@/types';

export function calculateCharges(
  players: Player[],
  deuces: DeuceResult,
  kps: KPResult[],
  slots: SlotResult[],
  parPoints: ParPointResult[],
  entryFee: number,
): PlayerCharge[] {
  const realPlayers = players.filter(p => !p.isPro);
  const winnings = new Map<string, { total: number; parts: string[] }>();

  const addWinning = (name: string, amount: number, label: string) => {
    const existing = winnings.get(name) || { total: 0, parts: [] };
    existing.total += amount;
    existing.parts.push(label);
    winnings.set(name, existing);
  };

  // Ace / Deuces
  if (deuces.isAce && deuces.aceWinner && deuces.aceAmount) {
    addWinning(deuces.aceWinner, deuces.aceAmount, `Ace $${deuces.aceAmount.toFixed(2)}`);
  } else {
    for (const w of deuces.winners) {
      const label = w.instances > 1
        ? `Deuce x${w.instances} $${w.payout.toFixed(2)}`
        : `Deuce $${w.payout.toFixed(2)}`;
      addWinning(w.player, w.payout, label);
    }
  }

  // KPs
  for (const kp of kps) {
    if (!kp.pending) {
      addWinning(kp.player, kp.payout, `KP $${kp.payout.toFixed(2)}`);
    }
  }

  // Slots
  for (const slot of slots) {
    const placeLabel = slot.place === 1 ? 'Slots 1st' : slot.place === 2 ? 'Slots 2nd' : 'Slots 3rd';
    for (const p of slot.players) {
      if (!p.isPro && p.totalPayout > 0) {
        addWinning(p.name, p.totalPayout, `${placeLabel} $${p.totalPayout.toFixed(2)}`);
      }
    }
  }

  // Par Points
  for (const pp of parPoints) {
    const placeLabel = pp.place === 1 ? 'Par Points 1st' : pp.place === 2 ? 'Par Points 2nd' : 'Par Points 3rd';
    addWinning(pp.player, pp.payout, `${placeLabel} $${pp.payout.toFixed(2)}`);
  }

  // Build charge list: winners first (by total desc), then non-winners (alphabetical)
  const charges: PlayerCharge[] = realPlayers.map(p => {
    const w = winnings.get(p.name);
    return {
      name: p.name,
      charge: entryFee,
      won: w ? w.total : 0,
      breakdown: w ? w.parts.join(' + ') : '',
      net: (w ? w.total : 0) - entryFee,
    };
  });

  // Sort: winners by total desc, then non-winners alphabetically
  charges.sort((a, b) => {
    if (a.won > 0 && b.won > 0) return b.won - a.won;
    if (a.won > 0) return -1;
    if (b.won > 0) return 1;
    return a.name.localeCompare(b.name);
  });

  return charges;
}
