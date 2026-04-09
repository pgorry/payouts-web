import type { ParPointWinner, ParPointResult, RulesConfig } from '@/types';

export function calculateParPoints(
  winners: ParPointWinner[],
  parPointsPool: number,
  _playerCount: number,
  rules: RulesConfig,
): ParPointResult[] {
  const splits = rules.splits;

  const placingWinners = winners.slice(0, splits.length);

  return placingWinners.map((winner, i) => ({
    place: i + 1,
    percentage: splits[i],
    player: winner.player,
    payout: parPointsPool * (splits[i] / 100),
  }));
}
