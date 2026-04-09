import { forwardRef } from 'react';
import type { PayoutResults } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';

interface ChargesCardProps {
  results: PayoutResults;
}

export const ChargesCard = forwardRef<HTMLDivElement, ChargesCardProps>(
  ({ results }, ref) => {
    const { pool, charges, totalPaidOut } = results;
    const winners = charges.filter(c => c.won > 0);
    const nonWinners = charges.filter(c => c.won === 0);

    return (
      <div
        ref={ref}
        className="bg-card rounded-2xl p-8 max-w-[600px] shadow-2xl"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
      >
        <div className="flex items-center justify-between bg-[#2a3550] rounded-xl px-5 py-3 mb-4">
          <div>
            <h1 className="text-teal text-2xl font-bold">UGC Mens Charges & Payouts</h1>
            <div className="text-text-muted text-base">
              {formatDate(results.date)} • {pool.playerCount} Players
            </div>
          </div>
          <img src="/UGC-Logo-2.png" alt="UGC" className="h-14 w-auto bg-white/90 rounded-lg p-1" />
        </div>
        {results.kpReturnedToPot > 0 && (
          <div className="text-text-muted text-xs italic mb-4">
            {formatCurrency(results.kpReturnedToPot)} from unclaimed KPs added back to slots/par points pool
          </div>
        )}

        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-text-dim text-xs uppercase tracking-wider py-2 px-3 border-b-2 border-border-accent font-medium">Player</th>
              <th className="text-right text-text-dim text-xs uppercase tracking-wider py-2 px-3 border-b-2 border-border-accent font-medium">Charge</th>
              <th className="text-right text-text-dim text-xs uppercase tracking-wider py-2 px-3 border-b-2 border-border-accent font-medium">Won</th>
              <th className="text-right text-text-dim text-xs uppercase tracking-wider py-2 px-3 border-b-2 border-border-accent font-medium">Net</th>
            </tr>
          </thead>
          <tbody>
            {winners.map((c) => (
              <tr key={c.name} className="bg-card-highlight">
                <td className="py-2.5 px-3 text-sm">{c.name}</td>
                <td className="py-2.5 px-3 text-sm text-right text-red">{formatCurrency(c.charge)}</td>
                <td className="py-2.5 px-3 text-sm text-right text-emerald">{formatCurrency(c.won)}</td>
                <td className={`py-2.5 px-3 text-sm text-right font-bold ${c.net >= 0 ? 'text-emerald' : 'text-red'}`}>
                  {c.net >= 0 ? '+' : '-'}{formatCurrency(Math.abs(c.net))}
                </td>
              </tr>
            ))}

            {/* Separator */}
            {nonWinners.length > 0 && (
              <tr>
                <td colSpan={4} className="py-1 border-b-2 border-border-accent" />
              </tr>
            )}

            {nonWinners.map((c) => (
              <tr key={c.name}>
                <td className="py-2.5 px-3 text-sm">{c.name}</td>
                <td className="py-2.5 px-3 text-sm text-right text-red">{formatCurrency(c.charge)}</td>
                <td className="py-2.5 px-3 text-sm text-right text-emerald">—</td>
                <td className="py-2.5 px-3 text-sm text-right font-bold text-red">-{formatCurrency(c.charge)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t-2 border-teal mt-5 pt-4">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1.5 px-3 font-bold text-base">Total Collected</td>
                <td className="py-1.5 px-3 text-right font-bold text-base text-red">{formatCurrency(pool.totalCollected)}</td>
              </tr>
              <tr>
                <td className="py-1.5 px-3 font-bold text-base">Total Paid Out</td>
                <td className="py-1.5 px-3 text-right font-bold text-base text-emerald">{formatCurrency(totalPaidOut)}</td>
              </tr>
              {results.kpReturnedToPot > 0 && (
                <tr>
                  <td className="py-1.5 px-3 font-bold text-base">KPs → Pot</td>
                  <td className="py-1.5 px-3 text-right font-bold text-base text-teal">{formatCurrency(results.kpReturnedToPot)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

ChargesCard.displayName = 'ChargesCard';
