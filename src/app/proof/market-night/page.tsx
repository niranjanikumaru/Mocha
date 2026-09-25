/**
 * /proof/market-night — Crew Pass as non-paid acquisition channel evidence
 * Redirects to the existing market-night page with a context banner
 */
'use client';

import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProofMarketNight() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to existing market-night with a slight delay for banner display
    const t = setTimeout(() => router.push('/market-night'), 800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <div className="bg-[var(--brand-dim)] border-b border-[var(--brand-border)] px-4 py-2.5 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-1.5 text-[11px] text-[var(--brand)] hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Decision Cockpit
        </Link>
        <div className="w-px h-4 bg-[var(--brand-border)]" />
        <Users className="w-3.5 h-3.5 text-[var(--brand)] shrink-0" />
        <span className="text-[11px] text-[var(--text-secondary)]">
          <strong className="text-[var(--brand)]">Trust Evidence — Crew Pass (Non-paid channel):</strong>{' '}
          Redirecting to Market Night demo... This is the live Crew Pass system that feeds the Crew CAC model input.
        </span>
      </div>
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-[12px]">
        Redirecting to Market Night...
      </div>
    </div>
  );
}
