import type { RoundInput, DeuceEntry, DeuceResult } from '@/types';

export function calculateDeuces(
  round: RoundInput,
  deuces: DeuceEntry[],
  deucePot: number,
): DeuceResult {
  if (round.hasAce && round.aceWinner) {
    return {
      isAce: true,
      aceWinner: round.aceWinner,
      aceAmount: deucePot,
      totalInstances: 0,
      perInstance: 0,
      winners: [],
    };
  }

  const totalInstances = deuces.reduce((sum, d) => sum + d.instances, 0);
  const perInstance = totalInstances > 0 ? deucePot / totalInstances : 0;

  return {
    isAce: false,
    totalInstances,
    perInstance,
    winners: deuces.map(d => ({
      player: d.player,
      instances: d.instances,
      payout: d.instances * perInstance,
    })),
  };
}
