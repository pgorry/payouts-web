import { forwardRef } from 'react';
import type { PayoutResults } from '@/types';
import { formatCurrency, formatDate, formatPlace } from '@/lib/format';

interface PayoutsCardProps {
  results: PayoutResults;
}

export const PayoutsCard = forwardRef<HTMLDivElement, PayoutsCardProps>(
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
              {results.slots.some(s => s.players.some(p => p.isPro)) && ' (+ Pros)'}
            </div>
          </div>
          <img src="UGC-Logo-2.png" alt="UGC" className="h-14 w-auto bg-white/90 rounded-lg p-1" />
        </div>

        {/* Money Pool */}
        <SectionHeader>Money Pool</SectionHeader>
        <table className="w-full mb-4">
          <tbody>
            <Row label="Total Collected" amount={pool.totalCollected} />
            <Row label={`Deuce Pot (${pool.playerCount} x $${results.pool.deucePot / pool.playerCount})`} amount={pool.deucePot} />
            <Row label={`KPs (${kps.length} x ${formatCurrency(pool.kpEach)})`} amount={pool.kpTotal} />
            <Row label={`Slots Pool (${Math.round(pool.slotsPool / pool.remaining * 100)}%)`} amount={pool.slotsPool} />
            <Row label={`Par Points Pool (${Math.round(pool.parPointsPool / pool.remaining * 100)}%)`} amount={pool.parPointsPool} />
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
            <div className="text-text-muted text-xs italic mb-2">
              {formatCurrency(pool.deucePot)} / {deuces.totalInstances} instances = {formatCurrency(deuces.perInstance)} per instance
            </div>
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
        {results.kpReturnedToPot > 0 && (
          <div className="text-text-muted text-xs italic mb-4">
            {formatCurrency(results.kpReturnedToPot)} from unclaimed KPs redistributed to slots/par points pool
          </div>
        )}

        {/* Slots */}
        <SectionHeader>Slots</SectionHeader>
        {slots.some(s => s.proRedistributionNote) && (
          <div className="text-text-muted text-xs italic mb-2">
            {slots.find(s => s.proRedistributionNote)?.proRedistributionNote}
          </div>
        )}
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
                  {formatPlace(slot.place)} ({slot.percentage}%)
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

        {/* Par Points */}
        <SectionHeader>Par Points</SectionHeader>
        <table className="w-full mb-4">
          <tbody>
            {parPoints.map((pp, i) => (
              <tr key={pp.place} className={i === 0 ? 'bg-card-highlight' : ''}>
                <td className="py-2 px-3 text-text-muted">
                  {formatPlace(pp.place)} ({pp.percentage}%)
                </td>
                <td className="py-2 px-3">{pp.player}</td>
                <td className="py-2 px-3 text-right font-semibold text-emerald">{formatCurrency(pp.payout)}</td>
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

        {/* Totals */}
        <div className="border-t-2 border-teal mt-4 pt-4">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 px-3 font-bold text-base">Total Collected</td>
                <td className="py-1 px-3 text-right font-bold text-base text-emerald">{formatCurrency(pool.totalCollected)}</td>
              </tr>
              <tr>
                <td className="py-1 px-3 font-bold text-base">Total Paid Out</td>
                <td className="py-1 px-3 text-right font-bold text-base text-emerald">{formatCurrency(results.totalPaidOut)}</td>
              </tr>
              {results.kpReturnedToPot > 0 && (
                <tr>
                  <td className="py-1 px-3 font-bold text-base">KPs → Pot</td>
                  <td className="py-1 px-3 text-right font-bold text-base text-teal">{formatCurrency(results.kpReturnedToPot)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

PayoutsCard.displayName = 'PayoutsCard';

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

function Row({ label, amount, pending }: { label: string; amount: number; pending?: boolean }) {
  return (
    <tr>
      <td className="py-2 px-3 text-text-muted">{label}</td>
      <td className={`py-2 px-3 text-right font-semibold ${pending ? 'text-amber' : 'text-emerald'}`}>
        {formatCurrency(amount)}{pending ? ' ⏳' : ''}
      </td>
    </tr>
  );
}
