'use client';

/**
 * MonthlyChart.tsx
 * Baseline vs Proposal line chart for a selected matched pair.
 * Uses recharts. Metric switchable: volume / revenue / active users / cumulative contribution.
 * Chart and table share the same data source.
 */

import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { ScenarioPair } from '../../core/growth/strategyMap';
import type { MonthlySnapshot } from '../../core/growth/model';

type Metric = 'volume' | 'revenue' | 'activeUsers' | 'cumulativeContribution';

const METRICS: Array<{ id: Metric; label: string; field: keyof MonthlySnapshot; cumulative?: boolean }> = [
  { id: 'volume', label: 'Monthly Volume (USD)', field: 'volumeUsd' },
  { id: 'revenue', label: 'Net Revenue (USD)', field: 'totalRevenue' },
  { id: 'activeUsers', label: 'Active Traders', field: 'activeUsers' },
  { id: 'cumulativeContribution', label: 'Cumulative Contribution', field: 'contribution', cumulative: true },
];

function fmtUsd(n: number): string {
  if (!isFinite(n)) return '—';
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtN(n: number, metric: Metric): string {
  if (metric === 'activeUsers') return Math.round(n).toLocaleString();
  return fmtUsd(n);
}

interface ChartRow {
  month: number;
  baseline: number;
  proposal: number;
  delta: number;
}

function buildRows(pair: ScenarioPair, metric: Metric): ChartRow[] {
  const m = METRICS.find((m) => m.id === metric)!;
  let cumBase = 0, cumProp = 0;

  return pair.baseline.snapshots.map((snap, i) => {
    const propSnap = pair.proposal.snapshots[i];
    let bVal = snap[m.field] as number;
    let pVal = propSnap[m.field] as number;
    if (m.cumulative) {
      cumBase += bVal;
      cumProp += pVal;
      bVal = cumBase;
      pVal = cumProp;
    }
    return { month: snap.month, baseline: bVal, proposal: pVal, delta: pVal - bVal };
  });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  metric: Metric;
}

function CustomTooltip({ active, payload, label, metric }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const base = payload.find((p) => p.name === 'Baseline');
  const prop = payload.find((p) => p.name === 'Proposal');
  if (!base || !prop) return null;
  const delta = prop.value - base.value;
  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-lg p-3 text-[10px] shadow-xl">
      <p className="text-white/60 font-mono mb-2">Month {label}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#60a5fa]" />
          <span className="text-white/70">Baseline:</span>
          <span className="text-white font-mono">{fmtN(base.value, metric)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rotate-45 bg-[#f59e0b]" />
          <span className="text-white/70">Proposal:</span>
          <span className="text-white font-mono">{fmtN(prop.value, metric)}</span>
        </div>
        <div className="border-t border-white/10 mt-1 pt-1 flex items-center gap-2">
          <span className="text-white/50">Δ:</span>
          <span className={`font-mono font-bold ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {delta >= 0 ? '+' : ''}{fmtN(delta, metric)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface MonthlyChartProps {
  pair: ScenarioPair;
  showTable?: boolean;
}

export default function MonthlyChart({ pair, showTable = false }: MonthlyChartProps) {
  const [metric, setMetric] = useState<Metric>('cumulativeContribution');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const rows = useMemo(() => buildRows(pair, metric), [pair, metric]);
  const metricDef = METRICS.find((m) => m.id === metric)!;

  const yValues = rows.flatMap((r) => [r.baseline, r.proposal]);
  const yMin = Math.min(...yValues);
  const hasNegative = yMin < 0;

  return (
    <div className="space-y-3">
      {/* Metric selector */}
      <div className="flex flex-wrap gap-1.5">
        {METRICS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMetric(m.id)}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md border transition-colors ${
              metric === m.id
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'border-white/10 text-white/50 hover:text-white/80 hover:border-white/20'
            }`}
          >
            {m.label}
          </button>
        ))}
        <div className="flex-1" />
        {/* Chart / Table toggle */}
        <div className="flex rounded-md border border-white/10 overflow-hidden">
          {(['chart', 'table'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                viewMode === v ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {v === 'chart' ? 'Chart' : 'Table'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {viewMode === 'chart' && (
        <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] p-4">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={rows} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="month"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
                label={{ value: 'Month', position: 'insideBottom', fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                height={30}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
                tickFormatter={(v) => fmtN(v, metric)}
                width={60}
              />
              <Tooltip content={<CustomTooltip metric={metric} />} />
              <Legend
                iconType="circle"
                formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{value}</span>}
              />
              {hasNegative && (
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
              )}
              <Line
                type="monotone"
                dataKey="baseline"
                name="Baseline"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#60a5fa' }}
              />
              <Line
                type="monotone"
                dataKey="proposal"
                name="Proposal"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                strokeDasharray="6 2"
                activeDot={{ r: 4, fill: '#f59e0b' }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[9px] text-white/25 font-mono mt-2 text-center">
            ASSUMED MODEL OUTPUTS · {metricDef.label} · USD · Source: runModel()
          </p>
        </div>
      )}

      {/* Table */}
      {viewMode === 'table' && (
        <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] overflow-auto">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-3 py-2 text-left text-white/40">Mo</th>
                <th className="px-3 py-2 text-right text-blue-400">Baseline</th>
                <th className="px-3 py-2 text-right text-amber-400">Proposal</th>
                <th className="px-3 py-2 text-right text-white/40">Δ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.month} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-3 py-1.5 text-white/50">{row.month}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300">{fmtN(row.baseline, metric)}</td>
                  <td className="px-3 py-1.5 text-right text-amber-300">{fmtN(row.proposal, metric)}</td>
                  <td className={`px-3 py-1.5 text-right font-bold ${row.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {row.delta >= 0 ? '+' : ''}{fmtN(row.delta, metric)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[9px] text-white/20 font-mono p-2 text-center">
            Chart and table share the same source data (runModel). Values agree exactly.
          </p>
        </div>
      )}
    </div>
  );
}
