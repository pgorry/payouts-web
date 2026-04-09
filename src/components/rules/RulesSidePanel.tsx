import { useState } from 'react';
import { usePayout } from '@/context/PayoutContext';
import { DEFAULT_RULES } from '@/lib/rules/defaults';
import { formatCurrency } from '@/lib/format';

export function RulesSidePanel() {
  const { state, dispatch } = usePayout();
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const rules = state.rules;
  const realPlayers = state.players.filter(p => !p.isPro);
  const isOver32 = realPlayers.length >= rules.playerThreshold;

  const updateRule = <K extends keyof typeof rules>(key: K, value: typeof rules[K]) => {
    dispatch({ type: 'SET_RULES', payload: { ...rules, [key]: value } });
  };

  const resetRules = () => {
    dispatch({ type: 'SET_RULES', payload: DEFAULT_RULES });
    setIsEditing(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-4 bg-card border border-border-accent text-teal px-3 py-2 rounded-lg hover:bg-card-highlight transition-colors text-sm z-10"
      >
        ⚙️ Rules
      </button>
    );
  }

  return (
    <div className="bg-card border-l border-border w-80 p-5 space-y-5 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-teal font-semibold text-sm uppercase tracking-wide">Rules</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-text-dim hover:text-text text-lg"
        >
          ✕
        </button>
      </div>

      {/* Entry Fee */}
      <RuleRow label="Entry Fee" editing={isEditing}>
        {isEditing ? (
          <NumberInput value={rules.entryFee} onChange={(v) => updateRule('entryFee', v)} prefix="$" />
        ) : (
          <span className="text-emerald font-medium">{formatCurrency(rules.entryFee)}</span>
        )}
      </RuleRow>

      {/* Deuce Contribution */}
      <RuleRow label="Deuce Contribution" editing={isEditing}>
        {isEditing ? (
          <NumberInput value={rules.deuceContribution} onChange={(v) => updateRule('deuceContribution', v)} prefix="$" />
        ) : (
          <span className="text-emerald font-medium">{formatCurrency(rules.deuceContribution)} / player</span>
        )}
      </RuleRow>

      {/* KP Prizes */}
      <RuleRow label="KP Prize" editing={isEditing}>
        {isEditing ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-text-dim">Under {rules.playerThreshold}:</span>
              <NumberInput value={rules.kpPrizeUnder32} onChange={(v) => updateRule('kpPrizeUnder32', v)} prefix="$" small />
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-text-dim">{rules.playerThreshold}+:</span>
              <NumberInput value={rules.kpPrizeOver32} onChange={(v) => updateRule('kpPrizeOver32', v)} prefix="$" small />
            </div>
          </div>
        ) : (
          <span className="text-emerald font-medium">
            {formatCurrency(isOver32 ? rules.kpPrizeOver32 : rules.kpPrizeUnder32)} each
            <span className="text-text-dim text-xs ml-1">
              ({realPlayers.length > 0 ? (isOver32 ? '32+' : '<32') : '—'})
            </span>
          </span>
        )}
      </RuleRow>

      {/* Pool Split */}
      <RuleRow label="Pool Split" editing={isEditing}>
        {isEditing ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-text-dim">Slots:</span>
              <NumberInput value={Math.round(rules.slotsPercent * 100)} onChange={(v) => updateRule('slotsPercent', v / 100)} suffix="%" small />
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-text-dim">Par Pts:</span>
              <NumberInput value={Math.round(rules.parPointsPercent * 100)} onChange={(v) => updateRule('parPointsPercent', v / 100)} suffix="%" small />
            </div>
          </div>
        ) : (
          <span className="text-text font-medium text-sm">
            {Math.round(rules.slotsPercent * 100)}% slots / {Math.round(rules.parPointsPercent * 100)}% par pts
          </span>
        )}
      </RuleRow>

      {/* Payout Splits */}
      <RuleRow label="Payout Split" editing={isEditing}>
        {isEditing ? (
          <SplitInput splits={rules.splits} onChange={(v) => updateRule('splits', v)} />
        ) : (
          <span className="text-text font-medium text-sm">
            Top {rules.splits.length}: {rules.splits.join('/')}%
          </span>
        )}
      </RuleRow>

      {/* Threshold */}
      <RuleRow label="Player Threshold" editing={isEditing}>
        {isEditing ? (
          <NumberInput value={rules.playerThreshold} onChange={(v) => updateRule('playerThreshold', v)} />
        ) : (
          <span className="text-text font-medium text-sm">{rules.playerThreshold} players</span>
        )}
      </RuleRow>

      {/* Buttons */}
      <div className="pt-2 space-y-2">
        {isEditing ? (
          <>
            <button
              onClick={() => setIsEditing(false)}
              className="w-full bg-teal text-background font-medium px-4 py-2 rounded-lg hover:bg-teal/90 text-sm"
            >
              Done Editing
            </button>
            <button
              onClick={resetRules}
              className="w-full bg-card border border-border-accent text-text-muted font-medium px-4 py-2 rounded-lg hover:border-red/50 text-sm"
            >
              Reset to Defaults
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full bg-card border border-border-accent text-teal font-medium px-4 py-2 rounded-lg hover:bg-card-highlight text-sm"
          >
            ✏️ Edit Rules
          </button>
        )}
      </div>
    </div>
  );
}

function RuleRow({ label, children, editing }: { label: string; children: React.ReactNode; editing: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${editing ? 'bg-card-highlight' : ''}`}>
      <div className="text-text-dim text-xs uppercase tracking-wide mb-1">{label}</div>
      {children}
    </div>
  );
}

function NumberInput({
  value, onChange, prefix, suffix, small
}: {
  value: number; onChange: (v: number) => void; prefix?: string; suffix?: string; small?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {prefix && <span className="text-text-dim text-sm">{prefix}</span>}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`bg-background border border-border-accent rounded px-2 py-1 text-text focus:outline-none focus:border-teal ${small ? 'w-16 text-xs' : 'w-20 text-sm'}`}
      />
      {suffix && <span className="text-text-dim text-sm">{suffix}</span>}
    </div>
  );
}

function SplitInput({ splits, onChange }: { splits: number[]; onChange: (v: number[]) => void }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      {splits.map((v, i) => (
        <span key={i} className="flex items-center gap-0.5">
          {i > 0 && <span className="text-text-dim">/</span>}
          <input
            type="number"
            value={v}
            onChange={(e) => {
              const newSplits = [...splits];
              newSplits[i] = Number(e.target.value);
              onChange(newSplits);
            }}
            className="bg-background border border-border-accent rounded px-1.5 py-1 text-text w-12 text-xs focus:outline-none focus:border-teal"
          />
        </span>
      ))}
      <span className="text-text-dim">%</span>
    </div>
  );
}
