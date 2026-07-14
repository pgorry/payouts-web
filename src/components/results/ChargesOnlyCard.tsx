import { forwardRef } from 'react';
import type { PayoutResults } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { TierBadge } from './TierBadge';

interface ChargesOnlyCardProps {
  results: PayoutResults;
}

export const ChargesOnlyCard = forwardRef<HTMLDivElement, ChargesOnlyCardProps>(
  ({ results }, ref) => {
    const { pool, charges } = results;
    const sortedCharges = [...charges].sort((a, b) => a.name.localeCompare(b.name));

    return (
      <div
        ref={ref}
        className="bg-card rounded-2xl p-8 max-w-[500px] shadow-2xl"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
      >
        <div className="flex items-center justify-between bg-[#2a3550] rounded-xl px-5 py-3 mb-4">
          <div>
            <h1 className="text-teal text-2xl font-bold">UGC Mens Charges</h1>
            <div className="text-text-muted text-base">
              {formatDate(results.date)} • {pool.playerCount} Players
              {pool.openPlayPlayerCount > 0 && ` + ${pool.openPlayPlayerCount} Open Play`}
              {pool.kpOnlyPlayerCount > 0 && ` + ${pool.kpOnlyPlayerCount} KP Only`}
            </div>
          </div>
          <img src="UGC-Logo-2.png" alt="UGC" className="h-14 w-auto bg-white/90 rounded-lg p-1" />
        </div>

        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-text-dim text-xs uppercase tracking-wider py-2 px-3 border-b-2 border-border-accent font-medium">Player</th>
              <th className="text-right text-text-dim text-xs uppercase tracking-wider py-2 px-3 border-b-2 border-border-accent font-medium">Charge</th>
            </tr>
          </thead>
          <tbody>
            {sortedCharges.map((c) => (
              <tr key={c.name}>
                <td className="py-2.5 px-3 text-sm">{c.name}<TierBadge tier={c.tier} /></td>
                <td className="py-2.5 px-3 text-sm text-right text-red font-semibold">{formatCurrency(c.charge)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t-2 border-teal mt-5 pt-4">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1.5 px-3 font-bold text-base">Total Collected</td>
                <td className="py-1.5 px-3 text-right font-bold text-base text-red">{formatCurrency(pool.totalCollected)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

ChargesOnlyCard.displayName = 'ChargesOnlyCard';
