'use client';

import { ShieldCheck, Zap, AlertTriangle, RefreshCw, Copy, CreditCard, Activity, CheckCircle, Clock } from 'lucide-react';

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

const STEPS: { id: DemoStep; num: string; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'OPEN_POSITION',
    num: '01',
    label: 'Open Position (5× Long)',
    desc: 'Allocates margin & starts continuous 8ms margin health loop.',
    icon: <Zap className="w-3.5 h-3.5 text-[var(--brand)]" />,
  },
  {
    id: 'ADVERSE_SHOCK',
    num: '02',
    label: 'Trigger Adverse Shock (−7.5%)',
    desc: 'Simulates mark price drawdown into Reduced Buffer territory.',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-[var(--yellow)]" />,
  },
  {
    id: 'SUBMIT_CLOSE_ACK_DROP',
    num: '03',
    label: 'Close Order (ACK Dropped)',
    desc: 'Simulates network failure where execution ACK never returns.',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-[var(--red)]" />,
  },
  {
    id: 'SHOW_UNRESOLVED',
    num: '04',
    label: 'Inspect Unresolved State',
    desc: 'Terminal locks duplicate submissions and isolates risk.',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-[var(--text-secondary)]" />,
  },
  {
    id: 'RECONCILE_PARTIAL',
    num: '05',
    label: 'Reconcile Venue (< 100ms)',
    desc: 'Fetches partial fill (60/100 contracts) and updates exposure.',
    icon: <RefreshCw className="w-3.5 h-3.5 text-[var(--brand)]" />,
  },
  {
    id: 'DUPLICATE_PAYMENT',
    num: '06',
    label: 'Duplicate Payment Replay',
    desc: 'Tests webhook idempotency engine with deduplication key.',
    icon: <CreditCard className="w-3.5 h-3.5 text-[var(--green)]" />,
  },
];

export default function JudgeDemoController({ currentStep, metrics, onStep }: JudgeDemoControllerProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)]">
      {/* Title */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--brand)]" />
            <span className="font-bold text-[13px] tracking-tight text-[var(--text-primary)] uppercase">Demo Controller</span>
          </div>
          <span className="badge badge-brand">Judge Suite</span>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
          Verify margin transparency and asynchronous transaction recovery under adverse network conditions.
        </p>
      </div>

      {/* Live SLA Benchmarks */}
      <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <p className="section-label px-0 mb-2">Live SLA Metrics</p>
        <div className="space-y-1.5">
          {[
            {
              label: 'Recon Latency',
              target: '< 100ms',
              val: metrics.reconciliationMs !== null ? `${metrics.reconciliationMs}ms` : '—',
              pass: metrics.reconciliationMs === null ? null : metrics.reconciliationMs < 100,
            },
            {
              label: 'Idempotency Drift',
              target: '0.00ms',
              val: `${metrics.duplicatesBlocked} blocked`,
              pass: true,
            },
            {
              label: 'Margin Calc Tick',
              target: '< 10ms',
              val: metrics.lastTickMs !== null ? `${metrics.lastTickMs}ms` : '—',
              pass: metrics.lastTickMs === null ? null : metrics.lastTickMs < 10,
            },
            {
              label: 'Stale Masking',
              target: '< 500ms',
              val: `${metrics.staleDataDetections} detected`,
              pass: null,
            },
            {
              label: 'Ledger Commit',
              target: '< 5ms',
              val: metrics.ledgerWriteMs !== null ? `${metrics.ledgerWriteMs}ms` : '—',
              pass: metrics.ledgerWriteMs === null ? null : metrics.ledgerWriteMs < 5,
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  item.pass === null ? 'bg-[var(--text-muted)]' : item.pass ? 'bg-[var(--green)]' : 'bg-[var(--red)]'
                }`} />
                <span className="text-[var(--text-secondary)]">{item.label}</span>
                <span className="text-[9px] text-[var(--text-muted)] font-mono">({item.target})</span>
              </div>
              <span className={`font-mono font-bold ${
                item.pass === null ? 'text-[var(--text-muted)]' : item.pass ? 'text-[var(--green)]' : 'text-[var(--red)]'
              }`}>
                {item.val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Step Buttons */}
      <div className="p-3 flex-1 overflow-y-auto space-y-2">
        <p className="section-label px-1">Scenario Steps</p>
        {STEPS.map((step) => {
          const isActive = currentStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => onStep(step.id)}
              className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                isActive
                  ? 'bg-[var(--bg-interactive)] border-[var(--brand)] shadow-sm'
                  : 'bg-[var(--bg-elevated)] border-[var(--border)] hover:bg-[var(--bg-interactive)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">{step.num}</span>
                  {step.icon}
                  <span className={`text-[12px] font-semibold ${isActive ? 'text-[var(--brand)]' : 'text-[var(--text-primary)]'}`}>
                    {step.label}
                  </span>
                </div>
                {isActive && <span className="badge badge-brand text-[9px]">RUNNING</span>}
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] mt-1 pl-6 leading-normal">
                {step.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Regulatory / Educational Footer */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-base)] text-[10px] text-[var(--text-muted)] leading-relaxed space-y-1">
        <p>• Prototype demonstration for judge evaluation.</p>
        <p>• Fictional pricing & contract parameters.</p>
        <p>• MochaTrade is not Kalshi; no regulatory endorsement implied.</p>
      </div>
    </div>
  );
}
