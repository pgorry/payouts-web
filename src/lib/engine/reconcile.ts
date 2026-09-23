import type {
  DeuceResult,
  KPResult,
  ParPointResult,
  PlayerCharge,
  Reconciliation,
  SlotResult,
} from '@/types';
import { formatCurrency, formatPlace } from '@/lib/format';

/** Anything under half a cent is floating-point noise, not missing money. */
const TOLERANCE = 0.005;

interface ReconcileInput {
  charges: PlayerCharge[];
  deucePot: number;
  deuces: DeuceResult;
  kps: KPResult[];
  slots: SlotResult[];
  slotsPool: number;
  parPoints: ParPointResult[];
  parPointsPool: number;
}

/**
 * Check that every dollar charged is paid back out, and explain any gap.
 *
 * Money in is the sum of every player's charge; money out is the sum of what
 * those same players won. Each pot is then checked on its own, so the warning
 * can say *which* pot is short rather than just "doesn't add up".
 */
export function reconcile({
  charges,
  deucePot,
  deuces,
  kps,
  slots,
  slotsPool,
  parPoints,
  parPointsPool,
}: ReconcileInput): Reconciliation {
  const moneyIn = charges.reduce((sum, c) => sum + c.charge, 0);
  const moneyOut = charges.reduce((sum, c) => sum + c.won, 0);
  const difference = moneyIn - moneyOut;
  const issues: string[] = [];

  // Deuce pot: paid either as an ace or split across deuces.
  const deucesPaid = deuces.isAce
    ? (deuces.aceWinner ? deuces.aceAmount ?? 0 : 0)
    : deuces.winners.reduce((sum, w) => sum + w.payout, 0);
  if (deucePot - deucesPaid > TOLERANCE) {
    issues.push(
      deuces.isAce && !deuces.aceWinner
        ? `Ace is ticked but no ace winner is entered — the ${formatCurrency(deucePot)} deuce pot is unpaid.`
        : `No deuces were found, so the ${formatCurrency(deucePot)} deuce pot is unpaid. ` +
            'Is the Deuce Pot leaderboard missing from the export?',
    );
  }

  // Slots: fewer placing teams than places to pay leaves part of the pool.
  const slotsPaid = slots.reduce((sum, s) => sum + s.teamPayout, 0);
  if (slotsPool - slotsPaid > TOLERANCE) {
    issues.push(
      `${formatCurrency(slotsPool - slotsPaid)} of the slots pool is unpaid — ` +
        `only ${slots.length} slot team${slots.length === 1 ? '' : 's'} found for the places being paid.`,
    );
  }
  // A team made up entirely of pros has nobody to hand their share to.
  for (const s of slots) {
    const paid = s.players.reduce((sum, p) => sum + p.totalPayout, 0);
    if (s.players.every(p => p.isPro) && s.teamPayout > TOLERANCE && paid < TOLERANCE) {
      issues.push(`Slots ${formatPlace(s.place)} is all pros — ${formatCurrency(s.teamPayout)} has no one to go to.`);
    }
  }

  const parPointsPaid = parPoints.reduce((sum, p) => sum + p.payout, 0);
  if (parPointsPool - parPointsPaid > TOLERANCE) {
    issues.push(
      `${formatCurrency(parPointsPool - parPointsPaid)} of the par points pool is unpaid — ` +
        `only ${parPoints.length} par points winner${parPoints.length === 1 ? '' : 's'} found.`,
    );
  }

  // Prizes won by someone who isn't on the charge sheet never show up in
  // money out: usually a name spelt differently between leaderboards.
  const charged = new Set(charges.map(c => c.name));
  const orphans: { name: string; amount: number; label: string }[] = [];
  const checkWinner = (name: string | undefined, amount: number, label: string) => {
    if (name && amount > TOLERANCE && !charged.has(name)) orphans.push({ name, amount, label });
  };
  if (deuces.isAce) {
    checkWinner(deuces.aceWinner, deuces.aceAmount ?? 0, 'Ace');
  } else {
    for (const w of deuces.winners) checkWinner(w.player, w.payout, 'Deuce');
  }
  for (const kp of kps) if (!kp.pending) checkWinner(kp.player, kp.payout, `KP ${kp.hole}`);
  for (const s of slots) {
    for (const p of s.players) if (!p.isPro) checkWinner(p.name, p.totalPayout, `Slots ${formatPlace(s.place)}`);
  }
  for (const pp of parPoints) checkWinner(pp.player, pp.payout, `Par Points ${formatPlace(pp.place)}`);
  for (const o of orphans) {
    issues.push(
      `${o.name} won ${formatCurrency(o.amount)} (${o.label}) but isn't on the charge sheet — ` +
        'check the name matches the roster.',
    );
  }

  const balanced = Math.abs(difference) <= TOLERANCE;
  if (!balanced && issues.length === 0) {
    issues.push(`Money in and money out differ by ${formatCurrency(Math.abs(difference))} and the cause couldn't be pinned down.`);
  }

  return { moneyIn, moneyOut, difference, balanced, issues };
}
