'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowUpRight, ArrowRight, Layers, Users, ShieldCheck, SlidersHorizontal, X, TrendingUp } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { runModel } from '@/core/growth/model';
import { PRESET_SCENARIOS } from '@/core/growth/scenarios';
import TextAnimation from '@/components/ui/staggerText';
import { GlowBorderCard } from '@/components/ui/glow-border-card';

const DecisionWorkspace = dynamic(() => import('@/components/DecisionWorkspace'), {
  loading: () => <p className="workspace-loading">Opening your detailed workspace…</p>,
});
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(value);
const number = (value: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const spaces = [
  { label: 'Trust & growth', detail: 'See how confidence becomes participation.', href: '/trust-funnel', icon: Layers, tag: '01 / STRATEGY', className: 'growth' },
  { label: 'Market Night', detail: 'Explore the fortnightly crew experience.', href: '/market-night', icon: Users, tag: '02 / COMMUNITY', className: 'community' },
  { label: 'Trading terminal', detail: 'Try the safeguards behind every trade.', href: '/proof/terminal', icon: ShieldCheck, tag: '03 / EXPERIENCE', className: 'terminal' },
];

export default function Home() {
  const [scenarioId, setScenarioId] = useState('recommended');
  const [advanced, setAdvanced] = useState(false);
  const reduced = useReducedMotion();
  const scenario = PRESET_SCENARIOS.find((item) => item.id === scenarioId) ?? PRESET_SCENARIOS[0];
  const result = useMemo(() => runModel(scenario.inputs), [scenario]);
  const last = result.snapshots[result.snapshots.length - 1];
  const maxRevenue = Math.max(1, ...result.snapshots.map((point) => point.totalRevenue));
  const points = result.snapshots.map((point, i) => `${16 + (i / Math.max(1, result.snapshots.length - 1)) * 568},${156 - (point.totalRevenue / maxRevenue) * 132}`).join(' ');

  return (
    <main className="premium-home">
      <section className="premium-hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <div className="eyebrow"><span /> THE MOCHATRADE WORKSPACE</div>
          <h1 id="home-title"><TextAnimation>Clarity before</TextAnimation><br /><span className="hero-soft"><TextAnimation delay={0.15}>every move.</TextAnimation></span></h1>
          <p>One connected view of growth, trust and trading.<br className="desktop-break" /> Start with the big picture. Explore at your pace.</p>
          <div className="hero-actions">
            <Link href="/trust-funnel" className="premium-button">Explore the strategy <ArrowUpRight size={17} /></Link>
            <Link href="/proof/terminal" className="premium-text-link">Open terminal <ArrowRight size={16} /></Link>
          </div>
          <div className="hero-caption"><span className="caption-line" /> BUILT AROUND TRUST. DESIGNED FOR PEOPLE.</div>
        </div>
        <GlowBorderCard width="100%" height="auto" borderRadius="28px" borderWidth="1px" inset="0" blurAmount="0px" animationDuration={12}
          gradientColors={['#7fd7bc', '#26303c', '#202834', '#d7bd8b', '#202834']} paused={!!reduced} className="hero-signal">
          <div className="signal-header"><span><i /> STRATEGY SIGNAL</span><TrendingUp size={18} /></div>
          <div className="signal-value">{money(result.totalRevenue12m)}<span>Projected revenue · {scenario.inputs.months} months</span></div>
          <svg className="signal-chart" viewBox="0 0 600 180" role="img" aria-label={`Monthly revenue projection for ${scenario.name}. Starts at ${money(result.snapshots[0].totalRevenue)} and ends at ${money(last.totalRevenue)}.`}>
            <defs><linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#91d9c3" stopOpacity=".22" /><stop offset="100%" stopColor="#91d9c3" stopOpacity="0" /></linearGradient></defs>
            {[48, 100, 156].map((y) => <line key={y} x1="16" x2="584" y1={y} y2={y} stroke="#ffffff0c" strokeDasharray="3 6" />)}
            <polygon points={`16,180 ${points} 584,180`} fill="url(#revenue-fill)" />
            <polyline points={points} fill="none" stroke="#91d9c3" strokeWidth="2.5" strokeLinejoin="round" />
          </svg>
          <div className="signal-axis"><span>MONTH 01</span><span>MONTH {String(scenario.inputs.months).padStart(2, '0')}</span></div>
          <div className="signal-footer"><span>Scenario-based projection</span><span>USD · Not live results</span></div>
        </GlowBorderCard>
      </section>

      <section className="overview-section" aria-labelledby="overview-title">
        <div className="section-topline"><div><span className="eyebrow">THE BIG PICTURE</span><h2 id="overview-title">Less noise. More perspective.</h2></div>
          <div className="scenario-switch" role="group" aria-label="Projection scenario">{PRESET_SCENARIOS.map((item) => <button key={item.id} aria-pressed={scenarioId === item.id} onClick={() => setScenarioId(item.id)}>{item.id === 'stress' ? 'Stress test' : item.id === 'recommended' ? 'Recommended' : 'Baseline'}</button>)}</div>
        </div>
        <div className="premium-metrics">
          {[
            { label: 'Active traders', value: number(last.activeUsers), note: `Projected in month ${last.month}`, accent: 'mint' },
            { label: 'Contribution', value: money(result.totalContribution12m), note: `Revenue less modelled costs · ${scenario.inputs.months} months`, accent: result.totalContribution12m >= 0 ? 'gold' : 'rose' },
            { label: 'Trust score', value: `${Math.round(last.trustScore * 100)}%`, note: 'Model score from enabled trust levers', accent: 'blue' },
          ].map((metric) => <article className={`premium-metric ${metric.accent}`} key={metric.label}>
            <div className="metric-top"><span>{metric.label}</span><span className="metric-dot" /></div>
            <motion.p key={metric.value} initial={reduced ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>{metric.value}</motion.p>
            <small>{metric.note}</small>
          </article>)}
        </div>
        <p className="projection-note">Illustrative model outputs, not measured performance. Assumptions and sensitivity controls are available in the advanced workspace.</p>
        {result.warnings.length > 0 && <details className="premium-warnings"><summary>{result.warnings.length} model notes to review</summary><ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></details>}
      </section>

      <section className="spaces-section" aria-labelledby="spaces-title">
        <div className="section-topline"><div><span className="eyebrow">YOUR NEXT MOVE</span><h2 id="spaces-title">Choose a space.</h2></div><span className="section-aside">Connected tools. One clear purpose.</span></div>
        <div className="premium-spaces">{spaces.map(({ label, detail, href, icon: Icon, tag, className }) => <Link href={href} key={href} className={`space-card ${className}`}>
          <div className="space-top"><span>{tag}</span><ArrowUpRight size={18} /></div>
          <div className="space-visual" aria-hidden="true"><div className="space-ring" /><div className="space-ring inner" /><span><Icon size={31} strokeWidth={1.2} /></span></div>
          <h3>{label}</h3><p>{detail}</p>
        </Link>)}</div>
      </section>

      <section className="advanced-entry">
        <div><SlidersHorizontal size={19} /><div><h2>Ready to go deeper?</h2><p>Scenario controls, pricing sensitivity and the full assumption ledger.</p></div></div>
        <button className="premium-button secondary" aria-expanded={advanced} aria-controls="advanced-workspace" onClick={() => setAdvanced(!advanced)}>{advanced ? 'Close workspace' : 'Advanced workspace'}{advanced ? <X size={16} /> : <ArrowUpRight size={16} />}</button>
      </section>
      <div id="advanced-workspace" hidden={!advanced} className="advanced-workspace">{advanced && <DecisionWorkspace />}</div>
      <footer className="premium-home-footer"><span>mochatrade.</span><p>A clearer way to explore what comes next.</p><span>PROTOTYPE / 2026</span></footer>
    </main>
  );
}
