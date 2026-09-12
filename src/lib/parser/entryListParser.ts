import * as XLSX from 'xlsx';
import type { KpOnlyPlayer, Player } from '@/types';

export interface ParsedEntryList {
  /** Players who paid the full entry fee — the full competition. */
  fullEntryPlayers: Player[];
  /** Players who paid the open-play fee ($5): deuce + KP, no slots/par points. */
  openPlayPlayers: KpOnlyPlayer[];
  /** Players who paid the no-slots fee ($10): everything but slots. */
  noSlotsPlayers: KpOnlyPlayer[];
  /** Players who paid the KP-only fee ($2). */
  kpOnlyPlayers: KpOnlyPlayer[];
  /**
   * Entrants the sheet marks as a no-show ("NS") and charges nothing. They are
   * excluded from every paying roster — same as being absent from the list —
   * but tracked separately so they aren't reported as an unrecognised fee.
   */
  noShowPlayers: { name: string; event: string }[];
  /** Rows we couldn't classify (unrecognised fee), for a warning in the UI. */
  unknownFeeRows: { name: string; event: string; fee: number }[];
  /** Distinct fee amounts seen, e.g. [2, 5, 15]. */
  feesSeen: number[];
  sheetName: string;
}

const HEADER_ALIASES: Record<string, string[]> = {
  lastName: ['last name', 'last', 'surname'],
  firstName: ['first name', 'first', 'given name'],
  /**
   * Some exports (the hand-built "Player List and Slots Charges" sheet) carry a
   * single pre-formatted "Last, First" column instead of split name columns.
   */
  name: ['player', 'name', 'player name', 'golfer'],
  event: ['event', 'competition', 'comp'],
  fee: [
    'extra $$$',
    'extra $',
    'extra',
    'fee',
    'entry',
    'amount',
    'paid',
    '$',
    'to be charged',
    'to charge',
    'charged',
    'charge',
  ],
};

/**
 * Trailing tally rows the sheets end with — "33 total", "31 full $15", "2 @ $10",
 * "Total Purse Allocated:". They land in the name column on some exports, so a
 * blank-name check alone isn't enough to skip them.
 */
const SUMMARY_ROW = /^(total\b|total purse|\d+\s*(total|full|@))/i;

/** Markers for an entrant who showed up on the list but is charged nothing. */
const NO_SHOW = /^(ns|n\/s|dns|no.?show)$/i;

function normalise(s: unknown): string {
  return String(s ?? '').trim().toLowerCase();
}

function isSummaryRow(name: string): boolean {
  return SUMMARY_ROW.test(name.trim());
}

function isNoShowRow(row: unknown[]): boolean {
  return row.some(cell => typeof cell === 'string' && NO_SHOW.test(cell.trim()));
}

/** Locate the header row and map each logical column to its index. */
function findColumns(rows: unknown[][]): { headerRow: number; cols: Record<string, number> } | null {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (!row) continue;
    const cells = row.map(normalise);

    // Match aliases in priority order, not column order: a sheet carrying both
    // "Extra $$$" and "Charged" resolves to the former wherever each sits.
    const cols: Record<string, number> = {};
    for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
      for (const alias of aliases) {
        const idx = cells.findIndex(c => c === alias);
        if (idx >= 0) {
          cols[key] = idx;
          break;
        }
      }
    }

    // A usable entry list needs a name and a fee. The name can arrive either as
    // split Last/First columns or as one combined "Player" column. The Event
    // column is optional — newer exports ("Alphabetical Player List") drop it in
    // favour of an Amount column and a "Club Category Type" column, and we
    // classify on the amount paid regardless.
    const hasName = cols.lastName !== undefined || cols.name !== undefined;
    if (hasName && cols.fee !== undefined) {
      return { headerRow: i, cols };
    }
  }
  return null;
}

/**
 * Does this workbook look like an entry list (a flat roster of who paid what)
 * rather than a results leaderboard? Used to reject a mis-dropped file early.
 */
export function isEntryList(buffer: ArrayBuffer): boolean {
  try {
    const wb = XLSX.read(buffer, { type: 'array' });
    for (const name of wb.SheetNames) {
      const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1 }) as unknown[][];
      if (findColumns(rows)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Parse an entry list — a flat roster of who paid what.
 *
 * Two shapes are accepted, detected from the header row:
 *  - the club's "Alphabetical Player List" export: split Last Name / First Name
 *    columns, an Event column ("LvR", "Slots", …) and an "Extra $$$" column;
 *  - the hand-built "Player List and Slots Charges" sheet: a single "Player"
 *    column already in "Last, First" order and a "To be charged" column.
 *
 * Either way we classify purely on the amount paid rather than the event label,
 * so a renamed event doesn't silently break the split. Rows marked "NS" are
 * charged nothing and drop out of the field; the tally rows the sheets end with
 * ("33 total", "2 @ $10") are ignored.
 *
 * Names are emitted as "Last, First" to match the leaderboard's format; the
 * engine's name resolver handles the other direction anyway.
 */
export function parseEntryListXLS(
  buffer: ArrayBuffer,
  fullEntryFee: number,
  kpOnlyFee: number,
  openPlayFee: number,
  noSlotsFee: number,
): ParsedEntryList {
  const wb = XLSX.read(buffer, { type: 'array' });

  for (const sheetName of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
      header: 1,
    }) as unknown[][];

    const found = findColumns(rows);
    if (!found) continue;

    const { headerRow, cols } = found;
    const fullEntryPlayers: Player[] = [];
    const openPlayPlayers: KpOnlyPlayer[] = [];
    const noSlotsPlayers: KpOnlyPlayer[] = [];
    const kpOnlyPlayers: KpOnlyPlayer[] = [];
    const noShowPlayers: { name: string; event: string }[] = [];
    const unknownFeeRows: { name: string; event: string; fee: number }[] = [];
    const feesSeen = new Set<number>();

    for (let i = headerRow + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;

      const last =
        cols.lastName !== undefined ? String(row[cols.lastName] ?? '').trim() : '';
      const first =
        cols.firstName !== undefined ? String(row[cols.firstName] ?? '').trim() : '';
      const combined =
        cols.name !== undefined ? String(row[cols.name] ?? '').trim() : '';

      // Split columns win when present; the combined "Player" column is the
      // fallback for sheets that don't have them.
      let name: string;
      if (last || first) {
        name = first ? `${last}, ${first}` : last;
      } else {
        name = combined;
      }

      if (!name) continue; // blank separator or tally row with no name
      if (isSummaryRow(name)) continue; // "33 total", "31 full $15", …

      const event = cols.event !== undefined ? String(row[cols.event] ?? '').trim() : '';

      const fee = Number(row[cols.fee]);
      if (isNaN(fee) || fee <= 0) {
        // A no-show is deliberately charged nothing — record it, but don't
        // raise it as an unrecognised fee.
        if (isNoShowRow(row)) {
          noShowPlayers.push({ name, event });
        } else {
          unknownFeeRows.push({ name, event, fee: 0 });
        }
        continue;
      }
      feesSeen.add(fee);

      // A "Pro for Slots" marker can appear in any column, same as elsewhere.
      const isPro = row.some(
        cell => typeof cell === 'string' && cell.toLowerCase().includes('pro for slots'),
      );

      // Classify on the amount paid, not the event label — a renamed event
      // (e.g. "Wolrige Shield") then can't silently break the split.
      if (fee === kpOnlyFee) {
        kpOnlyPlayers.push({ name, isPro, event });
      } else if (fee === openPlayFee) {
        openPlayPlayers.push({ name, isPro, event });
      } else if (fee === noSlotsFee) {
        noSlotsPlayers.push({ name, isPro, event });
      } else if (fee >= fullEntryFee) {
        fullEntryPlayers.push({ name, isPro });
      } else {
        unknownFeeRows.push({ name, event, fee });
      }
    }

    return {
      fullEntryPlayers,
      openPlayPlayers,
      noSlotsPlayers,
      kpOnlyPlayers,
      noShowPlayers,
      unknownFeeRows,
      feesSeen: [...feesSeen].sort((a, b) => a - b),
      sheetName,
    };
  }

  throw new Error(
    "That doesn't look like an entry list — no sheet with a player name column " +
      '(Last Name, or a combined Player column) and a fee column (Extra $$$, ' +
      'Amount, or To be charged).',
  );
}
