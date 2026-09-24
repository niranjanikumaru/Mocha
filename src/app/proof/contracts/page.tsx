/**
 * /proof/contracts — Contract Rules as expansion-cost evidence
 * Redirects to the existing contract-rules page with context banner
 */
'use client';

import Link from 'next/link';
import { ArrowLeft, Zap } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProofContracts() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.push('/contract-rules'), 800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <div className="bg-[var(--brand-dim)] border-b border-[var(--brand-border)] px-4 py-2.5 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-1.5 text-[11px] text-[var(--brand)] hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Decision Cockpit
        </Link>
        <div className="w-px h-4 bg-[var(--brand-border)]" />
        <Zap className="w-3.5 h-3.5 text-[var(--brand)] shrink-0" />
        <span className="text-[11px] text-[var(--text-secondary)]">
          <strong className="text-[var(--brand)]">Trust Evidence — Contract Rules:</strong>{' '}
          Redirecting... Versioned contract receipts reduce dispute cost and lower the marginal cost of adding a new market.
        </span>
      </div>
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-[12px]">
        Redirecting to Contract Rules...
      </div>
    </div>
  );
}
