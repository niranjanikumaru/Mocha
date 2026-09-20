'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Award, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

interface MarketNightCelebrationProps {
  onDismiss: () => void;
  teamName: string;
}

export default function MarketNightCelebration({ onDismiss, teamName }: MarketNightCelebrationProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Auto-dismiss or let user click
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md fade-in">
      <div className="relative w-full max-w-lg card-elevated border-2 border-[var(--brand)] bg-[var(--bg-surface)] p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.35)] overflow-hidden">
        {/* Glow effect background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[var(--brand)] opacity-20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[var(--green)] opacity-20 blur-3xl rounded-full pointer-events-none" />

        {/* Animated Badge */}
        <div className="w-16 h-16 rounded-2xl bg-[var(--brand-dim)] border-2 border-[var(--brand)] flex items-center justify-center mx-auto mb-4 text-[var(--brand)] shadow-lg animate-bounce">
          <Award className="w-8 h-8" />
        </div>

        <div className="space-y-1 mb-4">
          <span className="badge badge-brand tracking-widest text-[11px] uppercase">
            ⚡ 4/4 Verified Check-in
          </span>
          <h2 className="text-[22px] font-extrabold text-[var(--text-primary)] tracking-tight">
            Crew Complete. Crew Pass Unlocked!
          </h2>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Congratulations <strong className="text-[var(--brand)]">{teamName}</strong>! All four members have checked in for tonight’s event.
          </p>
        </div>

        {/* Unlocked perks pill */}
        <div className="card p-3.5 bg-[var(--bg-elevated)] border-[var(--border)] mb-5 text-left space-y-2 text-[12px]">
          <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
            Now Activated for All 4 Members
          </p>
          <div className="flex items-center gap-2 text-[var(--text-primary)]">
            <CheckCircle2 className="w-4 h-4 text-[var(--green)] shrink-0" />
            <span><strong>Exclusive Scenario:</strong> NVDA Q3 Shock & Geopolitical Export Freeze</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-primary)]">
            <CheckCircle2 className="w-4 h-4 text-[var(--green)] shrink-0" />
            <span><strong>Team Analysis Report:</strong> Downloadable post-debrief decision matrix</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-primary)]">
            <CheckCircle2 className="w-4 h-4 text-[var(--green)] shrink-0" />
            <span><strong>Guest Trader Session:</strong> 1 prioritized question submission</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { setShow(false); onDismiss(); }}
            className="btn btn-brand btn-full py-2.5 text-[14px]"
          >
            <span>Enter Scenario Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
