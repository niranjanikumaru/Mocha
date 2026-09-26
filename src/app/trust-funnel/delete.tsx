'use client';

/**
 * Market Night Trust & Growth Funnel — Founder Decision Cockpit
 * ─────────────────────────────────────────────────────────────────────────────
 * Route: /trust-funnel
 *
 * Founder-Facing Interface helping founders answer:
 *  1. Where people drop out.
 *  2. Which intervention addresses uncertainty at that stage.
 *  3. Which effects are assumptions vs observed evidence.
 *  4. What the programme costs.
 *  5. How the recommendation compares with a baseline.
 */

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp, RotateCcw, Download, Shield, ShieldCheck,
  ChevronDown, ArrowLeft, BarChart3, HelpCircle, Layers,
  ExternalLink, Eye, Sliders, DollarSign, Activity,
} from 'lucide-react';

import {
  runTrustFunnelModel,
  compareInterventionImpact,
  DEFAULT_TRUST_FUNNEL_INPUTS,
  FOUNDER_FUNNEL_SCENARIOS,
  TrustFunnelModelInputs,
  TrustIntervention,
  FounderFunnelScenario,
} from '../../core/growth/trustFunnelModel';

import KpiCards from '../../components/TrustFunnel/KpiCards';
import MonthSelector from '../../components/TrustFunnel/MonthSelector';
import AcquisitionFunnel from '../../components/TrustFunnel/AcquisitionFunnel';
import RetentionPanel from '../../components/TrustFunnel/RetentionPanel';
import InterventionDrawer from '../../components/TrustFunnel/InterventionDrawer';
import DropoffModal, { DropoffStageData } from '../../components/TrustFunnel/DropoffModal';
import DemoModal from '../../components/TrustFunnel/DemoModal';

export default function TrustFunnelPage() {
  // Scenario state
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('founder_recommended');
  const [compareScenarioId, setCompareScenarioId] = useState<string>('founder_paid_baseline');

  // Custom modified inputs (for when founder tweaks assumptions)
  const [activeInputs, setActiveInputs] = useState<TrustFunnelModelInputs>(() => {
    const sc = FOUNDER_FUNNEL_SCENARIOS.find((s) => s.id === 'founder_recommended');
    return sc ? JSON.parse(JSON.stringify(sc.inputs)) : DEFAULT_TRUST_FUNNEL_INPUTS;
  });

  // Selected month (1..12)
  const [selectedMonth, setSelectedMonth] = useState<number>(3);

  // Currency view: USD ($) or INR (₹ at 86.85)
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const currencySymbol = currency === 'USD' ? '$' : '₹';
  const currencyMultiplier = currency === 'USD' ? 1 : 86.85;

  // Active drawer & modal states
  const [activeInterventionId, setActiveInterventionId] = useState<string | null>(null);
  const [dropoffData, setDropoffData] = useState<DropoffStageData | null>(null);
  const [demoModalInfo, setDemoModalInfo] = useState<{ route: string; title: string } | null>(null);

  // Find active and comparator scenarios
  const selectedScenarioMeta = useMemo(
    () => FOUNDER_FUNNEL_SCENARIOS.find((s) => s.id === selectedScenarioId) ?? FOUNDER_FUNNEL_SCENARIOS[0],
    [selectedScenarioId]
  );

  const compareScenarioMeta = useMemo(
    () => FOUNDER_FUNNEL_SCENARIOS.find((s) => s.id === compareScenarioId) ?? null,
    [compareScenarioId]
  );

  // Switch selected scenario
  const handleSelectScenario = (id: string) => {
    setSelectedScenarioId(id);
    const target = FOUNDER_FUNNEL_SCENARIOS.find((s) => s.id === id);
    if (target) {
      setActiveInputs(JSON.parse(JSON.stringify(target.inputs)));
    }
  };

  // Run model on active inputs
  const selectedOutput = useMemo(
    () => runTrustFunnelModel(activeInputs),
    [activeInputs]
  );

  // Run model on comparator
  const compareOutput = useMemo(() => {
    if (!compareScenarioMeta) return null;
    return runTrustFunnelModel(compareScenarioMeta.inputs);
  }, [compareScenarioMeta]);

  // Selected month snapshots
  const selectedSnapshot = selectedOutput.snapshots[selectedMonth - 1] ?? selectedOutput.snapshots[0];
  const compareSnapshot = compareOutput ? (compareOutput.snapshots[selectedMonth - 1] ?? compareOutput.snapshots[0]) : null;

  // Active intervention object for drawer
  const activeIntervention = useMemo(() => {
    if (!activeInterventionId) return null;
    return activeInputs.interventions.find((i) => i.id === activeInterventionId) ?? null;
  }, [activeInterventionId, activeInputs.interventions]);

  // Update single intervention in active inputs
  const handleUpdateIntervention = useCallback((updated: TrustIntervention) => {
    setActiveInputs((prev) => ({
      ...prev,
      interventions: prev.interventions.map((i) => (i.id === updated.id ? updated : i)),
    }));
  }, []);

  // Reset to current scenario defaults
  const handleReset = () => {
    const sc = FOUNDER_FUNNEL_SCENARIOS.find((s) => s.id === selectedScenarioId);
    if (sc) {
      setActiveInputs(JSON.parse(JSON.stringify(sc.inputs)));
    }
  };

  // Export scenario assumptions & snapshots as JSON
  const handleExport = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      scenario: selectedScenarioMeta.name,
      comparator: compareScenarioMeta?.name ?? 'None',
      inputs: activeInputs,
      summary: selectedOutput.summary,
      monthlySnapshots: selectedOutput.snapshots,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mochatrade-trust-growth-funnel-${selectedScenarioId}-m${selectedMonth}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] pb-16">

      {/* ── SECTION A: HEADER ────────────────────────────────────────────────── */}
      <section className="premium-local-controls" aria-label="Growth scenario controls">
        {/* Main Header Content */}
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-bold tracking-tight text-[var(--text-primary)]">
                Where does trust change growth?
              </h1>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider">
                Projected under selected assumptions
              </span>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
              Inspect the intervention, test the assumption, compare the economics.
            </p>
          </div>

          {/* Scenario Selectors & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Selected Scenario Dropdown */}
            <div className="flex flex-col">
              <label className="text-[9px] font-mono text-[var(--text-muted)] uppercase">Strategy</label>
              <select
                value={selectedScenarioId}
                onChange={(e) => handleSelectScenario(e.target.value)}
                className="bg-[var(--bg-interactive)] border border-[var(--brand-border)] text-amber-400 rounded px-2.5 py-1 text-[11px] font-bold font-mono focus:outline-none"
              >
                {FOUNDER_FUNNEL_SCENARIOS.map((sc) => (
                  <option key={sc.id} value={sc.id} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                    {sc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Comparator Dropdown */}
            <div className="flex flex-col">
              <label className="text-[9px] font-mono text-[var(--text-muted)] uppercase">vs Comparator</label>
              <select
                value={compareScenarioId}
                onChange={(e) => setCompareScenarioId(e.target.value)}
                className="bg-[var(--bg-interactive)] border border-blue-500/40 text-blue-400 rounded px-2.5 py-1 text-[11px] font-bold font-mono focus:outline-none"
              >
                {FOUNDER_FUNNEL_SCENARIOS.map((sc) => (
                  <option key={sc.id} value={sc.id} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                    {sc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Toggle */}
            <div className="flex flex-col">
              <label className="text-[9px] font-mono text-[var(--text-muted)] uppercase">Currency</label>
              <button
                onClick={() => setCurrency((c) => (c === 'USD' ? 'INR' : 'USD'))}
                className="bg-[var(--bg-interactive)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded px-2 py-1 text-[11px] font-mono font-bold"
                title="Toggle currency display"
              >
                {currency} ({currencySymbol})
              </button>
            </div>

            {/* Reset Actions */}
            <div className="flex items-end gap-1 pt-3 sm:pt-0">
              <button
                onClick={handleReset}
                className="p-1.5 rounded bg-[var(--bg-interactive)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-colors"
                title="Reset active scenario assumptions to defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleExport}
                className="p-1.5 rounded bg-[var(--bg-interactive)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-colors"
                title="Export scenario data as JSON"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN DASHBOARD CONTAINER ────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── SECTION B: FOUR KPI CARDS ──────────────────────────────────────── */}
        <section aria-label="Executive KPI Summary">
          <KpiCards
            selectedOutput={selectedOutput}
            compareOutput={compareOutput}
            currencySymbol={currencySymbol}
            currencyMultiplier={currencyMultiplier}
          />
        </section>

        {/* ── SECTION C: MONTH SELECTOR ──────────────────────────────────────── */}
        <section aria-label="Month Selection">
          <MonthSelector
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
          />
        </section>

        {/* ── SECTION D: INTERACTIVE ACQUISITION FUNNEL ──────────────────────── */}
        <section aria-label="Acquisition Funnel">
          <AcquisitionFunnel
            selectedSnapshot={selectedSnapshot}
            compareSnapshot={compareSnapshot}
            selectedMonth={selectedMonth}
            interventions={activeInputs.interventions}
            onOpenIntervention={(id) => setActiveInterventionId(id)}
            onOpenDropoff={(data) => setDropoffData(data)}
          />
        </section>

        {/* ── SECTION E: SEPARATE RETENTION PANEL ────────────────────────────── */}
        <details className="premium-disclosure"><summary>Retention insights <span>Explore return visits and sustained activity</span></summary>
        <section aria-label="Retention Panel">
          <RetentionPanel
            selectedSnapshot={selectedSnapshot}
            compareSnapshot={compareSnapshot}
            allSelectedSnapshots={selectedOutput.snapshots}
            selectedMonth={selectedMonth}
            interventions={activeInputs.interventions}
            onOpenIntervention={(id) => setActiveInterventionId(id)}
          />
        </section>
        </details>

        {/* ── INTERVENTIONS SUMMARY / HYPOTHESES LIST ────────────────────────── */}
        <details className="premium-disclosure"><summary>Trust interventions <span>Inspect and edit the assumptions behind the model</span></summary>
        <section className="card p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <div>
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Active Trust Interventions (Editable Hypotheses)
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Click any intervention to inspect uncertainty, rollout coverage, evidence provenance, or test zero-effect counterfactuals.
              </p>
            </div>
            <span className="text-[10px] font-mono text-amber-400">
              {activeInputs.interventions.filter((i) => i.enabled).length} of {activeInputs.interventions.length} enabled
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeInputs.interventions.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveInterventionId(item.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  item.enabled
                    ? 'bg-[var(--bg-elevated)] border-[var(--border)] hover:border-amber-500/50'
                    : 'bg-[var(--bg-base)] border-[var(--border-subtle)] opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-amber-400">{item.id}</span>
                    <span className="text-[11px] font-bold text-[var(--text-primary)] truncate">{item.name}</span>
                  </div>
                  <span
                    className={`text-[8px] font-mono px-1 py-0.5 rounded border ${
                      item.evidenceStatus === 'DEMO_OBSERVATION'
                        ? 'text-amber-400 border-amber-500/30'
                        : item.evidenceStatus === 'PILOT_OBSERVATION'
                        ? 'text-green-400 border-green-500/30'
                        : 'text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {item.evidenceStatus}
                  </span>
                </div>

                <div className="text-[10px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-2">
                  {item.description}
                </div>

                <div className="grid grid-cols-3 gap-1 text-center font-mono text-[9px] pt-2 border-t border-[var(--border-subtle)]">
                  <div className="p-1 rounded bg-[var(--bg-interactive)]">
                    <div className="text-[8px] text-[var(--text-muted)] uppercase">Launch</div>
                    <div className="text-amber-400 font-bold">M{item.rollout.launchMonth}</div>
                  </div>
                  <div className="p-1 rounded bg-[var(--bg-interactive)]">
                    <div className="text-[8px] text-[var(--text-muted)] uppercase">Effect</div>
                    <div className="text-amber-400 font-bold">
                      {item.assumedPercentagePointEffect >= 0 ? '+' : ''}
                      {(item.assumedPercentagePointEffect * 100).toFixed(0)}pp
                    </div>
                  </div>
                  <div className="p-1 rounded bg-[var(--bg-interactive)]">
                    <div className="text-[8px] text-[var(--text-muted)] uppercase">Setup</div>
                    <div className="text-[var(--text-primary)]">${item.setupCostUsd}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        </details>

      </main>

      {/* ── SECTION F: INTERVENTION DETAIL DRAWER ────────────────────────────── */}
      <InterventionDrawer
        intervention={activeIntervention}
        isOpen={!!activeIntervention}
        onClose={() => setActiveInterventionId(null)}
        onUpdateIntervention={handleUpdateIntervention}
        onOpenDemo={(route, title) => setDemoModalInfo({ route, title })}
      />

      {/* ── SECTION G: DROPOFF DETAILS MODAL ──────────────────────────────────── */}
      <DropoffModal
        data={dropoffData}
        isOpen={!!dropoffData}
        onClose={() => setDropoffData(null)}
        onOpenIntervention={(id) => {
          setDropoffData(null);
          setActiveInterventionId(id);
        }}
      />

      {/* ── WORKING DEMO MODAL (PRESERVES STATE) ───────────────────────────────── */}
      <DemoModal
        isOpen={!!demoModalInfo}
        onClose={() => setDemoModalInfo(null)}
        demoRoute={demoModalInfo?.route ?? null}
        demoTitle={demoModalInfo?.title ?? ''}
      />

    </div>
  );
}
