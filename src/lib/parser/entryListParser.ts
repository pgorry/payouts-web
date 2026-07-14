import * as XLSX from 'xlsx';
import type { KpOnlyPlayer, Player } from '@/types';

export interface ParsedEntryList {
  /** Players who paid the full entry fee — the full competition. */
  fullEntryPlayers: Player[];
  /** Players who paid the KP-only fee. */
  kpOnlyPlayers: KpOnlyPlayer[];
  /** Rows we couldn't classify (unrecognised fee), for a warning in the UI. */
  unknownFeeRows: { name: string; event: string; fee: number }[];
  /** Distinct fee amounts seen, e.g. [2, 15]. */
  feesSeen: number[];
  sheetName: string;
}

const HEADER_ALIASES: Record<string, string[]> = {
  lastName: ['last name', 'last', 'surname'],
  firstName: ['first name', 'first', 'given name'],
  event: ['event', 'competition', 'comp'],
  fee: ['extra $$$', 'extra $', 'extra', 'fee', 'entry', 'amount', 'paid', '$'],
};

function normalise(s: unknown): string {
  return String(s ?? '').trim().toLowerCase();
}

/** Locate the header row and map each logical column to its index. */
function findColumns(rows: unknown[][]): { headerRow: number; cols: Record<string, number> } | null {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (!row) continue;
    const cells = row.map(normalise);

    const cols: Record<string, number> = {};
    for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
      const idx = cells.findIndex(c => c && aliases.includes(c));
      if (idx >= 0) cols[key] = idx;
    }

    // A usable entry list needs a name, an event and a fee.
    if (cols.lastName !== undefined && cols.event !== undefined && cols.fee !== undefined) {
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
 * Parse the club's "Alphabetical Player List" export.
 *
 * Shape: one row per entrant, with an Event column ("LvR", "Slots", …) and an
 * "Extra $$$" column holding what they actually paid. We classify purely on the
 * amount paid rather than the event label, so a renamed event doesn't silently
 * break the split.
 *
 * Names are emitted as "Last, First" to match the leaderboard's format; the
 * engine's name resolver handles the other direction anyway.
 */
export function parseEntryListXLS(
  buffer: ArrayBuffer,
  fullEntryFee: number,
  kpOnlyFee: number,
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
    const kpOnlyPlayers: KpOnlyPlayer[] = [];
    const unknownFeeRows: { name: string; event: string; fee: number }[] = [];
    const feesSeen = new Set<number>();

    for (let i = headerRow + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;

      const last = String(row[cols.lastName] ?? '').trim();
      const first =
        cols.firstName !== undefined ? String(row[cols.firstName] ?? '').trim() : '';
      if (!last && !first) continue; // blank separator row

      const name = first ? `${last}, ${first}` : last;
      const event = String(row[cols.event] ?? '').trim();

      const fee = Number(row[cols.fee]);
      if (isNaN(fee) || fee <= 0) {
        unknownFeeRows.push({ name, event, fee: 0 });
        continue;
      }
      feesSeen.add(fee);

      // A "Pro for Slots" marker can appear in any column, same as elsewhere.
      const isPro = row.some(
        cell => typeof cell === 'string' && cell.toLowerCase().includes('pro for slots'),
      );

      if (fee === kpOnlyFee) {
        kpOnlyPlayers.push({ name, isPro, event });
      } else if (fee >= fullEntryFee) {
        fullEntryPlayers.push({ name, isPro });
      } else {
        unknownFeeRows.push({ name, event, fee });
      }
    }

    return {
      fullEntryPlayers,
      kpOnlyPlayers,
      unknownFeeRows,
      feesSeen: [...feesSeen].sort((a, b) => a - b),
      sheetName,
    };
  }

  throw new Error(
    "That doesn't look like an entry list — no sheet with Last Name / Event / Extra $$$ columns.",
  );
}
