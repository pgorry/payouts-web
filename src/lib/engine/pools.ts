import type { MoneyPool, RulesConfig } from '@/types';

export function calculatePool(
  playerCount: number,
  rules: RulesConfig,
  openPlayPlayerCount: number = 0,
  kpOnlyPlayerCount: number = 0,
): MoneyPool {
  const slotsCollected = playerCount * rules.entryFee;
  const openPlayCollected = openPlayPlayerCount * rules.openPlayEntryFee;
  const kpOnlyCollected = kpOnlyPlayerCount * rules.kpOnlyEntryFee;
  const totalCollected = slotsCollected + openPlayCollected + kpOnlyCollected;

  const deucePot =
    playerCount * rules.deuceContribution +
    openPlayPlayerCount * rules.openPlayDeuceContribution;

  // The per-KP prize rate is judged on the size of the KP *tournament*, which
  // includes the KP-only ($2) entrants — they bought into that competition, so
  // they count toward its field. The slots and par-points pools below are keyed
  // only off the players who paid the full entry.
  const kpFieldCount = playerCount + kpOnlyPlayerCount;
  const baseKpEach = kpFieldCount >= rules.playerThreshold
    ? rules.kpPrizeOver32
    : rules.kpPrizeUnder32;

  // Pool reservation and per-KP value are based on the standard number of cash
  // prizes, NOT the number of KP holes. This way an extra KP (paid in balls)
  // has no effect on the money pool.
  const cashCount = rules.kpCashCount;
  const baseKpTotal = cashCount * baseKpEach;
  const openPlayKpTotal = openPlayPlayerCount * rules.openPlayKpContribution;
  const kpTotal = baseKpTotal + openPlayKpTotal;
  const kpEach = cashCount > 0 ? kpTotal / cashCount : 0;

  // KP-only money does NOT inflate the KP prizes — the prizes stay at the
  // standard rate. It drops straight into the general pot and is split
  // slots/par points along with everything else.
  const remaining =
    slotsCollected -
    playerCount * rules.deuceContribution -
    baseKpTotal +
    kpOnlyCollected;
  const slotsPool = remaining * rules.slotsPercent;
  const parPointsPool = remaining * rules.parPointsPercent;

  return {
    totalCollected,
    deucePot,
    kpTotal,
    kpEach,
    remaining,
    slotsPool,
    parPointsPool,
    playerCount,
    openPlayPlayerCount,
    kpOnlyPlayerCount,
    kpOnlyCollected,
    kpFieldCount,
  };
}
