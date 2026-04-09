import { useRef, useState } from 'react';
import { usePayout } from '@/context/PayoutContext';
import { PayoutsCard } from './PayoutsCard';
import { SummaryCard } from './SummaryCard';
import { ChargesCard } from './ChargesCard';
import { exportCardAsPNG, copyCardToClipboard } from '@/lib/pngExport';
import { formatDate } from '@/lib/format';

function buildGmailLink(dateStr: string): string {
  const formattedDate = formatDate(dateStr);
  const to = 'dbyrne@universitygolf.com';
  const cc = [
    'derrick.horne@gmail.com',
    'fritzkeswick@yahoo.ca',
    'mark.ellis1@hotmail.com',
  ].join(',');
  const subject = `UGC Mens Club Payouts - ${formattedDate}`;
  const body = `Hi all,\n\nPlease find the payouts for ${formattedDate} attached.\n\nThanks`;

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&cc=${encodeURIComponent(cc)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function CopyButton({ elementRef }: { elementRef: React.RefObject<HTMLDivElement | null> }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        if (!elementRef.current) return;
        await copyCardToClipboard(elementRef.current);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="bg-teal/10 text-teal border border-teal/30 font-medium px-4 py-2 rounded-lg hover:bg-teal/20 transition-colors text-sm"
    >
      {copied ? '✓ Copied' : '📋 Copy'}
    </button>
  );
}

export function ResultsView() {
  const { state, dispatch } = usePayout();
  const payoutsRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const chargesRef = useRef<HTMLDivElement>(null);

  if (!state.results) return null;

  const dateStr = state.results.date;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-teal">Results</h2>
        <div className="flex items-center gap-3">
          <a
            href={buildGmailLink(dateStr)}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-teal/10 text-teal border border-teal/30 font-medium px-4 py-2 rounded-lg hover:bg-teal/20 transition-colors text-sm inline-flex items-center gap-2"
          >
            ✉️ Email Payouts
          </a>
          <button
            onClick={() => dispatch({ type: 'RESET' })}
            className="bg-card border border-border-accent text-text-muted font-medium px-4 py-2 rounded-lg hover:border-teal/50 transition-colors text-sm"
          >
            Start New Round
          </button>
        </div>
      </div>

      {/* Charges Card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">Payout Details</h3>
          <div className="flex items-center gap-2">
            <CopyButton elementRef={chargesRef} />
            <button
              onClick={() => chargesRef.current && exportCardAsPNG(chargesRef.current, `charges-${dateStr}.png`)}
              className="bg-teal/10 text-teal border border-teal/30 font-medium px-4 py-2 rounded-lg hover:bg-teal/20 transition-colors text-sm"
            >
              📥 Download
            </button>
          </div>
        </div>
        <ChargesCard ref={chargesRef} results={state.results} />
      </div>

      {/* Summary Card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">Payouts</h3>
          <div className="flex items-center gap-2">
            <CopyButton elementRef={summaryRef} />
            <button
              onClick={() => summaryRef.current && exportCardAsPNG(summaryRef.current, `summary-${dateStr}.png`)}
              className="bg-teal/10 text-teal border border-teal/30 font-medium px-4 py-2 rounded-lg hover:bg-teal/20 transition-colors text-sm"
            >
              📥 Download
            </button>
          </div>
        </div>
        <SummaryCard ref={summaryRef} results={state.results} />
      </div>

      {/* Payouts Card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">Summary</h3>
          <div className="flex items-center gap-2">
            <CopyButton elementRef={payoutsRef} />
            <button
              onClick={() => payoutsRef.current && exportCardAsPNG(payoutsRef.current, `payouts-${dateStr}.png`)}
              className="bg-teal/10 text-teal border border-teal/30 font-medium px-4 py-2 rounded-lg hover:bg-teal/20 transition-colors text-sm"
            >
              📥 Download
            </button>
          </div>
        </div>
        <PayoutsCard ref={payoutsRef} results={state.results} />
      </div>

    </div>
  );
}
