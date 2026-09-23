import type { Reconciliation } from '@/types';
import { formatCurrency } from '@/lib/format';

function Totals({ rec }: { rec: Reconciliation }) {
  const over = rec.difference < 0;
  return (
    <div className="text-sm text-red">
      Money in {formatCurrency(rec.moneyIn)} · Money out {formatCurrency(rec.moneyOut)} ·{' '}
      <span className="font-bold">
        {formatCurrency(Math.abs(rec.difference))} {over ? 'overpaid' : 'not paid out'}
      </span>
    </div>
  );
}

/** Always-visible banner on the results screen while the books don't balance. */
export function UnbalancedBanner({ rec }: { rec: Reconciliation }) {
  return (
    <div className="bg-red/15 border-2 border-red rounded-xl px-5 py-4 space-y-2">
      <div className="text-red text-lg font-bold">⛔ Money in does not equal money out</div>
      <Totals rec={rec} />
      <ul className="list-disc pl-5 space-y-1 text-sm text-red">
        {rec.issues.map(i => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}

/**
 * Blocking confirmation shown before copying, downloading or emailing payouts
 * that don't balance. The safe choice (go back) is the prominent one.
 */
export function UnbalancedConfirmModal({
  rec,
  actionLabel,
  onCancel,
  onConfirm,
}: {
  rec: Reconciliation;
  actionLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="bg-card border-4 border-red rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-red text-2xl font-bold">⛔ These payouts don't balance</div>
        <Totals rec={rec} />
        <ul className="list-disc pl-5 space-y-1 text-sm text-text">
          {rec.issues.map(i => <li key={i}>{i}</li>)}
        </ul>
        <p className="text-text-muted text-sm">
          Fix the data before sending these out. Only continue if you're sure the
          difference is intentional.
        </p>
        <div className="flex gap-3 justify-end pt-2">
          <button
            autoFocus
            onClick={onCancel}
            className="bg-teal text-background font-semibold px-5 py-2 rounded-lg hover:bg-teal/90 text-sm"
          >
            Go back and fix
          </button>
          <button
            onClick={onConfirm}
            className="border border-red/60 text-red font-medium px-4 py-2 rounded-lg hover:bg-red/10 text-sm"
          >
            {actionLabel} anyway
          </button>
        </div>
      </div>
    </div>
  );
}
