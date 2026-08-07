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

  // Open-play ($5) players buy into the deuce pot ($3) and the KP tournament
  // ($2). Their deuce share swells the deuce pot; their KP share is handled
  // below.
  const deucePot =
    playerCount * rules.deuceContribution +
    openPlayPlayerCount * rules.openPlayDeuceContribution;

  // The per-KP prize rate is judged on the size of the KP *tournament*, which
  // includes everyone who bought a KP entry: full-competition, open-play ($5)
  // and KP-only ($2) players alike. The slots and par-points pools below are
  // keyed only off the players who paid the full entry.
  const kpFieldCount = playerCount + openPlayPlayerCount + kpOnlyPlayerCount;
  const baseKpEach = kpFieldCount >= rules.playerThreshold
    ? rules.kpPrizeOver32
    : rules.kpPrizeUnder32;

  // Pool reservation and per-KP value are based on the standard number of cash
  // prizes at the standard rate — NOT the number of KP holes, and NOT inflated
  // by partial entrants. An extra KP (paid in balls), an open-play entry or a
  // KP-only entry all leave the per-KP prize untouched.
  const cashCount = rules.kpCashCount;
  const baseKpTotal = cashCount * baseKpEach;
  const kpTotal = baseKpTotal;
  const kpEach = cashCount > 0 ? kpTotal / cashCount : 0;

  // Neither the KP-only nor the open-play KP contribution inflates the prizes.
  // The KP-only fee ($2) and the KP portion of each open-play fee ($2) both
  // drop into the general pot and split slots/par points with everything else.
  const openPlayKpToPot = openPlayPlayerCount * rules.openPlayKpContribution;
  const remaining =
    slotsCollected -
    playerCount * rules.deuceContribution -
    baseKpTotal +
    kpOnlyCollected +
    openPlayKpToPot;
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
