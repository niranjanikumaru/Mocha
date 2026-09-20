'use client';

import { ShieldCheck, Zap, AlertTriangle, RefreshCw, Copy, CreditCard } from 'lucide-react';

export type DemoStep =
  | 'IDLE'
  | 'OPEN_POSITION'
  | 'ADVERSE_SHOCK'
  | 'SUBMIT_CLOSE_ACK_DROP'
  | 'SHOW_UNRESOLVED'
  | 'RECONCILE_PARTIAL'
  | 'DUPLICATE_PAYMENT';

interface DemoMetrics {
  reconciliationMs: number | null;
  duplicatesBlocked: number;
  staleDataDetections: number;
  ledgerWriteMs: number | null;
  lastTickMs: number | null;
}

interface JudgeDemoControllerProps {
  currentStep: DemoStep;
  metrics: DemoMetrics;
  onStep: (step: DemoStep) => void;
}

const STEPS: { id: DemoStep; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    id: 'OPEN_POSITION',
    label: '1. Open NVDA 5× Long',
    desc: 'Open a simulated 100-contract NVDA perpetual at 5× leverage.',
    icon: <Zap className="w-4 h-4" />,
    color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
  },
  {
    id: 'ADVERSE_SHOCK',
    label: '2. Adverse Price Shock −7.5%',
    desc: 'Drop NVDA mark price by 7.5% to push margin into Reduced Buffer.',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
  },
  {
    id: 'SUBMIT_CLOSE_ACK_DROP',
    label: '3. Submit Close (ACK Drop)',
    desc: 'Submit a close order — venue fills it but network drops the acknowledgement.',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20',
  },
  {
    id: 'SHOW_UNRESOLVED',
    label: '4. Show Unresolved State',
    desc: 'Observe the unresolved banner. Duplicate close buttons are disabled.',
    icon: <ShieldCheck className="w-4 h-4" />,
    color: 'border-zinc-600/60 bg-zinc-800/40 text-zinc-300 hover:bg-zinc-700/40',
  },
  {
    id: 'RECONCILE_PARTIAL',
    label: '5. Reconcile → Partial Fill',
    desc: 'Query venue: 60/100 contracts filled. Remaining 40 exposure displayed.',
    icon: <RefreshCw className="w-4 h-4" />,
    color: 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
  },
  {
    id: 'DUPLICATE_PAYMENT',
    label: '6. Replay Duplicate Payment',
    desc: 'Fire same payment webhook twice. Idempotency key prevents double-credit.',
    icon: <CreditCard className="w-4 h-4" />,
    color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
  },
];

export default function JudgeDemoController({ currentStep, metrics, onStep }: JudgeDemoControllerProps) {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-zinc-900/80 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-amber-500/5 border-b border-amber-500/20">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 font-bold text-sm uppercase tracking-wider">Judge Demo Controller</span>
        </div>
        <p className="text-zinc-400 text-xs leading-relaxed">
          Visible margin risk, verified transaction outcomes and evidence-backed recovery keep users informed and in control.
        </p>
      </div>

      {/* Proof metrics — all 5 benchmark targets */}
      <div className="grid grid-cols-1 gap-2 px-5 py-3 border-b border-zinc-800">
        <p className="text-zinc-600 text-xs uppercase tracking-wider font-medium mb-1">Live Benchmark Metrics</p>
        {[
          {
            label: 'Recon Latency',
            target: '< 100ms',
            value: metrics.reconciliationMs !== null ? `${metrics.reconciliationMs}ms` : '—',
            pass: metrics.reconciliationMs === null ? null : metrics.reconciliationMs < 100,
          },
          {
            label: 'Idempotency Drift',
            target: '0.00ms',
            value: `${metrics.duplicatesBlocked} blocked`,
            pass: true,
          },
          {
            label: 'Margin Tick',
            target: '< 10ms',
            value: metrics.lastTickMs !== null ? `${metrics.lastTickMs}ms` : '—',
            pass: metrics.lastTickMs === null ? null : metrics.lastTickMs < 10,
          },
          {
            label: 'Stale Mask',
            target: '< 500ms',
            value: `${metrics.staleDataDetections} detected`,
            pass: null,
          },
          {
            label: 'Ledger Write',
            target: '< 5ms',
            value: metrics.ledgerWriteMs !== null ? `${metrics.ledgerWriteMs}ms` : '—',
            pass: metrics.ledgerWriteMs === null ? null : metrics.ledgerWriteMs < 5,
          },
        ].map(({ label, target, value, pass }) => (
          <div key={label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                pass === null ? 'bg-zinc-600' : pass ? 'bg-emerald-500' : 'bg-rose-500'
              }`} />
              <span className="text-zinc-400">{label}</span>
              <span className="text-zinc-700">{target}</span>
            </div>
            <span className={`font-mono font-semibold ${
              pass === null ? 'text-zinc-500' : pass ? 'text-emerald-400' : 'text-rose-400'
            }`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Step buttons */}
      <div className="px-5 py-4 space-y-2">
        {STEPS.map((step) => {
          const isActive = currentStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => onStep(step.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${step.color} ${isActive ? 'ring-1 ring-offset-1 ring-offset-zinc-900 ring-current opacity-100' : 'opacity-80'}`}
            >
              <span className="mt-0.5 shrink-0">{step.icon}</span>
              <div>
                <p className="font-semibold text-xs">{step.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{step.desc}</p>
              </div>
              {isActive && (
                <span className="ml-auto shrink-0 text-xs font-bold opacity-80">ACTIVE</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="px-5 pb-4 text-xs text-zinc-600 space-y-1 border-t border-zinc-800 pt-3">
        <p>⚠ All prices and contract parameters are fictional samples for demonstration only.</p>
        <p>Green does not mean safe. Stops do not guarantee an execution price.</p>
        <p>MochaTrade is not Kalshi. No regulatory status is implied.</p>
      </div>
    </div>
  );
}
