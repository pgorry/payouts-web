import { forwardRef } from 'react';
import type { PayoutResults } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';

interface PaymentsOnlyCardProps {
  results: PayoutResults;
}

export const PaymentsOnlyCard = forwardRef<HTMLDivElement, PaymentsOnlyCardProps>(
  ({ results }, ref) => {
    const { pool, charges, totalPaidOut } = results;
    const winners = charges.filter(c => c.won > 0).sort((a, b) => b.won - a.won);

    return (
      <div
        ref={ref}
        className="bg-card rounded-2xl p-8 max-w-[600px] shadow-2xl"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
      >
        <div className="flex items-center justify-between bg-[#2a3550] rounded-xl px-5 py-3 mb-4">
          <div>
            <h1 className="text-teal text-2xl font-bold">UGC Mens Payouts</h1>
            <div className="text-text-muted text-base">
              {formatDate(results.date)} • {pool.playerCount} Players
              {pool.openPlayPlayerCount > 0 && ` + ${pool.openPlayPlayerCount} Open Play`}
            </div>
          </div>
          <img src="UGC-Logo-2.png" alt="UGC" className="h-14 w-auto bg-white/90 rounded-lg p-1" />
        </div>

        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-text-dim text-xs uppercase tracking-wider py-2 px-3 border-b-2 border-border-accent font-medium">Player</th>
              <th className="text-left text-text-dim text-xs uppercase tracking-wider py-2 px-3 border-b-2 border-border-accent font-medium">Breakdown</th>
              <th className="text-right text-text-dim text-xs uppercase tracking-wider py-2 px-3 border-b-2 border-border-accent font-medium">Won</th>
            </tr>
          </thead>
          <tbody>
            {winners.map((c) => (
              <tr key={c.name} className="bg-card-highlight">
                <td className="py-2.5 px-3 text-sm">{c.name}</td>
                <td className="py-2.5 px-3 text-text-muted text-xs">{c.breakdown}</td>
                <td className="py-2.5 px-3 text-sm text-right text-emerald font-semibold">{formatCurrency(c.won)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t-2 border-teal mt-5 pt-4">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1.5 px-3 font-bold text-base">Total Paid Out</td>
                <td className="py-1.5 px-3 text-right font-bold text-base text-emerald">{formatCurrency(totalPaidOut)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

PaymentsOnlyCard.displayName = 'PaymentsOnlyCard';
