import type { RoundData, RulesConfig, PayoutResults, KPResult, Player } from '@/types';
import { calculatePool } from './pools';
import { calculateDeuces } from './deuces';
import { calculateSlots } from './slots';
import { calculateParPoints } from './parPoints';
import { calculateCharges } from './charges';

/**
 * Match a KP winner name to a player in the list, handling "First Last" vs "Last, First" formats.
 */
function resolvePlayerName(input: string, players: Player[]): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Exact match
  if (players.some(p => p.name === trimmed)) return trimmed;

  // Case-insensitive match
  const lower = trimmed.toLowerCase();
  const ciMatch = players.find(p => p.name.toLowerCase() === lower);
  if (ciMatch) return ciMatch.name;

  // Try flipping "First Last" → "Last, First" and vice versa
  let flipped = '';
  if (trimmed.includes(', ')) {
    // "Last, First" → "First Last"
    const [last, first] = trimmed.split(', ', 2);
    flipped = `${first} ${last}`;
  } else if (trimmed.includes(' ')) {
    // "First Last" → "Last, First"
    const parts = trimmed.split(' ');
    const last = parts.pop()!;
    flipped = `${last}, ${parts.join(' ')}`;
  }

  if (flipped) {
    const flippedLower = flipped.toLowerCase();
    const flipMatch = players.find(p => p.name.toLowerCase() === flippedLower);
    if (flipMatch) return flipMatch.name;
  }

  // No match found, return as-is
  return trimmed;
}

/** Name key that ignores case and "Last, First" vs "First Last" ordering. */
function nameKey(name: string): string {
  const trimmed = name.trim().toLowerCase();
  const parts = trimmed.includes(',')
    ? trimmed.split(',').map(s => s.trim())
    : trimmed.split(/\s+/);
  return [...parts].sort().join('|');
}

export function calculatePayouts(data: RoundData, rules: RulesConfig): PayoutResults {
  const kpOnlyRoster = data.kpOnlyPlayers ?? [];

  // The entry list is the authority on what a player paid. If someone shows up
  // on the leaderboard *and* on the entry list as a KP-only ($2) entrant, the
  // entry list wins — otherwise they'd be charged the full entry and the $2,
  // and counted twice in the field.
  const kpOnlyKeys = new Set(kpOnlyRoster.map(p => nameKey(p.name)));
  const fullRoster =
    kpOnlyKeys.size > 0
      ? data.players.filter(p => !kpOnlyKeys.has(nameKey(p.name)))
      : data.players;

  const realPlayers = fullRoster.filter(p => !p.isPro);
  const playerCount = realPlayers.length;
  const openPlayPlayers = data.openPlayPlayers.filter(p => !p.isPro);
  const openPlayCount = openPlayPlayers.length;
  const kpOnlyPlayers = kpOnlyRoster.filter(p => !p.isPro);
  const kpOnlyCount = kpOnlyPlayers.length;

  const pool = calculatePool(playerCount, rules, openPlayCount, kpOnlyCount);
  const deuces = calculateDeuces(data.round, data.deuces, pool.deucePot);

  // Open-play and KP-only players are eligible to win KPs, so resolve names
  // against every roster.
  const allEligibleKpPlayers = [
    ...fullRoster,
    ...data.openPlayPlayers,
    ...kpOnlyRoster,
  ];

  // Resolve every KP hole to its winner (if any) and carry the manual override.
  const resolvedHoles = rules.kpHoles.map(hole => {
    const winner = data.kpWinners.find(kp => kp.hole === hole);
    return {
      hole,
      player: winner ? resolvePlayerName(winner.player, allEligibleKpPlayers) : '',
      override: winner?.prize,
    };
  });
  const claimedHoles = resolvedHoles.filter(h => h.player);

  // How many KP winners are paid cash vs balls. This depends only on counts and
  // manual overrides — never on *which* players — so we can settle the money
  // before knowing each player's winnings. Cash prizes are capped at the
  // standard cash count; any extra winners get a sleeve of balls.
  const explicitCashCount = claimedHoles.filter(h => h.override === 'cash').length;
  const unset = claimedHoles.filter(h => !h.override);
  const cashForUnset = Math.max(0, Math.min(unset.length, rules.kpCashCount - explicitCashCount));
  const numCashPaid = explicitCashCount + cashForUnset;

  // Any cash prize not awarded (no winner, or given as balls) returns to the pot.
  const kpReturnedToPot = (rules.kpCashCount - numCashPaid) * pool.kpEach;
  const adjustedSlotsPool = pool.slotsPool + kpReturnedToPot * rules.slotsPercent;
  const adjustedParPointsPool = pool.parPointsPool + kpReturnedToPot * rules.parPointsPercent;

  const slots = calculateSlots(data.slotTeams, adjustedSlotsPool, playerCount, rules);
  const parPoints = calculateParPoints(data.parPointWinners, adjustedParPointsPool, playerCount, rules);

  // Default ball allocation: among the unset KP winners, the ones who won the
  // most cash that day (par points, slots, deuces/ace) get balls.
  const otherWinnings = new Map<string, number>();
  const addWinning = (name: string, amount: number) =>
    otherWinnings.set(name, (otherWinnings.get(name) ?? 0) + amount);
  if (deuces.isAce && deuces.aceWinner) {
    addWinning(deuces.aceWinner, deuces.aceAmount ?? 0);
  } else {
    for (const w of deuces.winners) addWinning(w.player, w.payout);
  }
  for (const s of slots) for (const p of s.players) if (!p.isPro) addWinning(p.name, p.totalPayout);
  for (const pp of parPoints) addWinning(pp.player, pp.payout);

  const ballsForUnset = unset.length - cashForUnset;
  const ballsHoles = new Set(
    [...unset]
      .sort((a, b) => (otherWinnings.get(b.player) ?? 0) - (otherWinnings.get(a.player) ?? 0))
      .slice(0, ballsForUnset)
      .map(h => h.hole),
  );

  const kps: KPResult[] = resolvedHoles.map(h => {
    if (!h.player) {
      return { hole: h.hole, player: '', payout: pool.kpEach, pending: true, prize: 'cash' as const };
    }
    const prize: 'cash' | 'balls' = h.override ?? (ballsHoles.has(h.hole) ? 'balls' : 'cash');
    return {
      hole: h.hole,
      player: h.player,
      payout: prize === 'cash' ? pool.kpEach : 0,
      pending: false,
      prize,
    };
  });

  const charges = calculateCharges(
    fullRoster,
    data.openPlayPlayers,
    kpOnlyRoster,
    deuces,
    kps,
    slots,
    parPoints,
    rules.entryFee,
    rules.openPlayEntryFee,
    rules.kpOnlyEntryFee,
  );

  const totalPaidOut = charges.reduce((sum, c) => sum + c.won, 0);

  return {
    date: data.round.date,
    pool,
    deuces,
    kps,
    slots,
    parPoints,
    charges,
    totalPaidOut,
    kpsReserved: 0,
    kpReturnedToPot,
  };
}
