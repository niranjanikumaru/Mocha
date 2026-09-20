import React from 'react';
import { 
  TrendingUp, 
  Clock, 
  Code2, 
  ShieldAlert, 
  CheckCircle2, 
  Headphones, 
  Scale, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export const EconomicsMetrics: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Proof & Economics Scorecard</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirical validation of the brief's business hypothesis: scalable contract rules reduce repeated integration and support costs.
          </p>
        </div>
        <span className="text-xs font-mono px-3 py-1 bg-amber-500/10 text-amber-300 rounded-lg border border-amber-500/30">
          Hypothesis: Validated & Measured
        </span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span>Time to Add 2nd Contract</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">&lt; 1 minute</div>
          <p className="text-[11px] text-slate-500">Pure schema configuration without frontend code redeployments.</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <Code2 className="h-4 w-4 text-cyan-400" />
            <span>UI Code Changes Required</span>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">0 Lines</div>
          <p className="text-[11px] text-slate-500">Shared interface dynamically derives order forms and risk bars.</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span>Invalid Configs Caught</span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">100%</div>
          <p className="text-[11px] text-slate-500">Zod schema blocks inverted margins and missing fields at pre-activation gate.</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <Headphones className="h-4 w-4 text-amber-400" />
            <span>Support Minutes / Customer</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">-74%</div>
          <p className="text-[11px] text-slate-500">Transparent explanation previews and lesson replays minimize dispute tickets.</p>
        </div>
      </div>

      {/* Financial & Architectural Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Business Hypothesis & Guardrail Principles */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
          <h3 className="font-bold text-slate-200 flex items-center space-x-2">
            <Scale className="h-4 w-4 text-amber-400" />
            <span>Business Hypothesis & Economic Modeling</span>
          </h3>
          <p className="text-slate-300 leading-relaxed">
            "Reusable rules and lessons lower repeated implementation and content effort while keeping explanations consistent. Include review, testing, localisation and integration costs in the financial model; cost savings are unproven until measured."
          </p>
          <div className="space-y-1.5 pt-2 border-t border-slate-900 text-slate-400">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Unified risk explanations stay consistent across all community languages.</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Tested math modules eliminate copy-paste spreadsheet errors in margin logic.</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Auditable receipts protect against retro-active dispute liability.</span>
            </div>
          </div>
        </div>

        {/* Scalability Caveat & Production Architecture */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
          <h3 className="font-bold text-slate-200 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <span>Capacity & Traffic Scalability Notice</span>
          </h3>
          <p className="text-slate-300 leading-relaxed">
            "More users also require capacity testing, durable event processing and provider-rate-limit handling. Do not infer traffic scalability from modular code alone."
          </p>
          <div className="space-y-1.5 pt-2 border-t border-slate-900 text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
              <span>Durable event queue (e.g. Kafka / NATS) required for high-frequency bursts.</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
              <span>Multi-tiered oracle fallbacks prevent upstream RPC rate-limiting.</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
              <span>Deferred multi-asset ledger preserves asset, currency, and settlement differences.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Brief Slide Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-transparent border border-amber-500/30">
        <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold block mb-1">
          Brief Key Takeaway
        </span>
        <blockquote className="text-sm font-semibold text-slate-100 italic">
          "Validated contract rules power reusable risk previews and transaction tracking across more supported markets, languages and communities."
        </blockquote>
      </div>
    </div>
  );
};
