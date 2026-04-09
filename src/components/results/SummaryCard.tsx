import { forwardRef } from 'react';
import type { PayoutResults } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';

interface SummaryCardProps {
  results: PayoutResults;
}

export const SummaryCard = forwardRef<HTMLDivElement, SummaryCardProps>(
  ({ results }, ref) => {
    const { pool, deuces, kps, slots, parPoints, charges } = results;
    const winners = charges.filter(c => c.won > 0);

    return (
      <div
        ref={ref}
        className="bg-card rounded-2xl p-8 max-w-[700px] shadow-2xl"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
      >
        <div className="flex items-center justify-between bg-[#2a3550] rounded-xl px-5 py-3 mb-6">
          <div>
            <h1 className="text-teal text-2xl font-bold">UGC Mens Payouts</h1>
            <div className="text-text-muted text-base">
              {formatDate(results.date)} • {pool.playerCount} Players
              {slots.some(s => s.players.some(p => p.isPro)) && ' (+ Pros)'}
            </div>
          </div>
          <img src="/UGC-Logo-2.png" alt="UGC" className="h-14 w-auto bg-white/90 rounded-lg p-1" />
        </div>

        {/* Par Points */}
        <SectionHeader>Par Points</SectionHeader>
        <table className="w-full mb-4">
          <tbody>
            {parPoints.map((pp, i) => (
              <tr key={pp.place} className={i === 0 ? 'bg-card-highlight' : ''}>
                <td className="py-2 px-3 text-text-muted">
                  {pp.place === 1 ? '1st' : pp.place === 2 ? '2nd' : '3rd'}
                </td>
                <td className="py-2 px-3">{pp.player}</td>
                <td className="py-2 px-3 text-right font-semibold text-emerald">{formatCurrency(pp.payout)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Slots */}
        <SectionHeader>Slots</SectionHeader>
        <table className="w-full mb-4">
          <thead>
            <tr>
              <Th>Place</Th><Th>Team</Th><Th align="right">Per Player</Th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot, i) => (
              <tr key={slot.place} className={i === 0 ? 'bg-card-highlight' : ''}>
                <td className="py-2 px-3 text-text-muted">
                  {slot.place === 1 ? '1st' : slot.place === 2 ? '2nd' : '3rd'}
                </td>
                <td className="py-2 px-3">
                  {slot.players.map((p, j) => (
                    <span key={p.name}>
                      {j > 0 && <span className="text-text-dim"> / </span>}
                      <span className={p.isPro ? 'text-text-dim line-through' : ''}>{p.name.split(', ')[0]}</span>
                    </span>
                  ))}
                </td>
                <td className="py-2 px-3 text-right font-semibold text-emerald">
                  {formatCurrency(slot.players.find(p => !p.isPro)?.totalPayout ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Ace / Deuces */}
        {deuces.isAce ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <SectionHeader>Ace</SectionHeader>
              <span className="bg-red text-white text-xs font-bold px-2 py-0.5 rounded">HOLE IN ONE!</span>
            </div>
            <table className="w-full mb-4">
              <tbody>
                <tr>
                  <td className="py-2 px-3 text-white">{deuces.aceWinner}</td>
                  <td className="py-2 px-3 text-right font-semibold text-emerald">{formatCurrency(deuces.aceAmount ?? 0)}</td>
                </tr>
              </tbody>
            </table>
          </>
        ) : deuces.winners.length > 0 && (
          <>
            <SectionHeader>Deuces</SectionHeader>
            <table className="w-full mb-4">
              <tbody>
                {deuces.winners.map((w) => (
                  <tr key={w.player}>
                    <td className="py-2 px-3 text-white">{w.player}</td>
                    <td className="py-2 px-3 text-text-muted">x{w.instances}</td>
                    <td className="py-2 px-3 text-right font-semibold text-emerald">{formatCurrency(w.payout)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* KPs */}
        <SectionHeader>KP Winners</SectionHeader>
        <table className="w-full mb-4">
          <tbody>
            {kps.map((kp) => (
              <tr key={kp.hole}>
                <td className="py-2 px-3 text-text-muted">{kp.hole}</td>
                <td className="py-2 px-3">{kp.pending ? <span className="text-text-dim italic">No Winner</span> : kp.player}</td>
                <td className="py-2 px-3 text-right font-semibold text-emerald">{kp.pending ? '—' : formatCurrency(kp.payout)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Winners Summary */}
        <SectionHeader>Winners Summary</SectionHeader>
        <table className="w-full mb-4">
          <thead>
            <tr><Th>Player</Th><Th>Breakdown</Th><Th align="right">Total</Th></tr>
          </thead>
          <tbody>
            {winners.map((w) => (
              <tr key={w.name}>
                <td className="py-2 px-3 text-white">{w.name}</td>
                <td className="py-2 px-3 text-text-muted text-xs">{w.breakdown}</td>
                <td className="py-2 px-3 text-right font-semibold text-emerald">{formatCurrency(w.won)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

SummaryCard.displayName = 'SummaryCard';

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-teal text-sm font-semibold uppercase tracking-wider mt-5 mb-2">
      {children}
    </h2>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`text-text-dim text-xs uppercase tracking-wider py-2 px-3 border-b border-border-accent font-medium ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
}
