import type { Metadata } from 'next';
import FeeExperimentPanel from '../../components/FeeExperiment/FeeExperimentPanel';
import { TrendingUp } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Fee Experiment Lab — MochaTrade',
  description:
    'Connect your pricing decisions to customer impact and business outcomes. ' +
    'Adjust the platform fee, apply Market Night credits, model demand sensitivity, ' +
    'and compare pricing plans — all using one consistent calculation engine.',
};

export default function PricingPage() {
  return (
    <div className="fee-page-root">
      {/* ── Compact page header ── */}
      <header className="fee-page-header">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-[var(--brand)] flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.4)]">
              <TrendingUp className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-[15px] tracking-tight text-[var(--text-primary)]">
              Mocha<span className="text-[var(--brand)]">Trade</span>
            </span>
          </Link>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Fee Experiment Lab</span>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="btn btn-ghost btn-sm"
          >
            Terminal
          </Link>
          <Link
            href="/market-night"
            className="btn btn-ghost btn-sm"
          >
            Market Night
          </Link>
        </nav>
      </header>

      {/* ── Main content ── */}
      <main className="fee-page-main">
        <FeeExperimentPanel />
      </main>
    </div>
  );
}
