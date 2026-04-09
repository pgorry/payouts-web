import type { ParPointWinner, ParPointResult, RulesConfig } from '@/types';

export function calculateParPoints(
  winners: ParPointWinner[],
  parPointsPool: number,
  playerCount: number,
  rules: RulesConfig,
): ParPointResult[] {
  const splits = playerCount >= rules.playerThreshold
    ? rules.splitsOver
    : rules.splitsUnder;

  const placingWinners = winners.slice(0, splits.length);

  return placingWinners.map((winner, i) => ({
    place: winner.place,
    percentage: splits[i],
    player: winner.player,
    payout: parPointsPool * (splits[i] / 100),
  }));
}
