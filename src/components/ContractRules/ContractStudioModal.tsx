import React, { useState } from 'react';
import { 
  FileCode, 
  CheckCircle, 
  XCircle, 
  AlertOctagon, 
  Play, 
  Copy, 
  RefreshCw,
  Layers
} from 'lucide-react';
import { 
  CONTRACT_AERO_PERP, 
  CONTRACT_NEXUS_PERP, 
  INVALID_CONTRACT_INVERTED_MARGIN, 
  INVALID_CONTRACT_MISSING_FIELDS 
} from '../../core/catalogue/fixtures';
import { validateContractDefinition, type ValidationResult } from '../../core/catalogue/schema';
import { globalCatalogue } from '../../core/catalogue/registry';

interface ContractStudioModalProps {
  initialSample?: 'inverted' | 'missing' | 'valid';
  onContractActivated: () => void;
}

export const ContractStudioModal: React.FC<ContractStudioModalProps> = ({
  initialSample = 'valid',
  onContractActivated,
}) => {
  const getInitialCode = () => {
    if (initialSample === 'inverted') return JSON.stringify(INVALID_CONTRACT_INVERTED_MARGIN, null, 2);
    if (initialSample === 'missing') return JSON.stringify(INVALID_CONTRACT_MISSING_FIELDS, null, 2);
    return JSON.stringify(CONTRACT_AERO_PERP, null, 2);
  };

  const [jsonText, setJsonText] = useState<string>(getInitialCode());
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [activationMessage, setActivationMessage] = useState<string | null>(null);

  const handleValidate = () => {
    setActivationMessage(null);
    try {
      const parsed = JSON.parse(jsonText);
      const result = validateContractDefinition(parsed);
      setValidationResult(result);

      if (result.success && result.contract) {
        globalCatalogue.registerContract(result.contract);
        setActivationMessage(`Contract "${result.contract.identity.id}" successfully validated and activated into catalogue!`);
        onContractActivated();
      }
    } catch (err: any) {
      setValidationResult({
        success: false,
        errors: [{ path: 'JSON_SYNTAX', message: `Malformed JSON: ${err.message}` }],
      });
    }
  };

  const loadPreset = (preset: 'aero' | 'nexus' | 'inverted' | 'missing') => {
    setActivationMessage(null);
    let sample: any;
    if (preset === 'aero') sample = CONTRACT_AERO_PERP;
    else if (preset === 'nexus') sample = CONTRACT_NEXUS_PERP;
    else if (preset === 'inverted') sample = INVALID_CONTRACT_INVERTED_MARGIN;
    else sample = INVALID_CONTRACT_MISSING_FIELDS;

    const formatted = JSON.stringify(sample, null, 2);
    setJsonText(formatted);

    // Auto-run validation immediately to show result
    try {
      const result = validateContractDefinition(sample);
      setValidationResult(result);
    } catch (e: any) {
      // ignore
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Contract Studio & Schema Validation Engine</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enforces strict typed schema guardrails. Defective rules, inverted margins, or missing schedules are blocked before activation.
          </p>
        </div>

        {/* Preset Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-mono text-[11px] mr-1">Load Preset:</span>
          <button
            onClick={() => loadPreset('aero')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-mono"
          >
            AERO-PERP (Valid)
          </button>
          <button
            onClick={() => loadPreset('nexus')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-mono"
          >
            NEXUS-PERP (Valid)
          </button>
          <button
            onClick={() => loadPreset('inverted')}
            className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded-lg border border-rose-800/60 font-mono font-semibold"
          >
            Inverted Margin (Reject)
          </button>
          <button
            onClick={() => loadPreset('missing')}
            className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded-lg border border-rose-800/60 font-mono font-semibold"
          >
            Missing Fields (Reject)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Area */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-t-lg border-t border-x border-slate-800 text-xs">
            <span className="font-mono text-slate-400 flex items-center space-x-1.5">
              <FileCode className="h-3.5 w-3.5 text-amber-400" />
              <span>ContractDefinition.json</span>
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(jsonText)}
              className="text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </button>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={18}
            className="w-full bg-slate-950 border border-slate-800 rounded-b-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500/80 resize-none leading-relaxed"
            spellCheck={false}
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleValidate}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Play className="h-4 w-4 fill-slate-950" />
              <span>Validate & Activate Schema</span>
            </button>
          </div>
        </div>

        {/* Validation Diagnostics Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">
              Activation Gate Diagnostics
            </h3>

            {validationResult === null ? (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-6 text-center text-xs text-slate-500">
                <RefreshCw className="h-6 w-6 mx-auto mb-2 text-slate-600 animate-spin-slow" />
                <p>Click "Validate & Activate Schema" or pick a preset above to test schema verification.</p>
              </div>
            ) : validationResult.success ? (
              <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 text-xs space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  <span>SCHEMA VALIDATION PASSED</span>
                </div>
                <p className="text-slate-300">
                  All mathematical constraints, field completeness, and semantic version rules satisfied.
                </p>
                <div className="bg-slate-950/80 p-3 rounded-lg border border-emerald-900/40 font-mono text-[11px] space-y-1">
                  <div><strong>ID:</strong> {validationResult.contract?.identity.id}</div>
                  <div><strong>Margin Mode:</strong> {validationResult.contract?.marginSettings.mode} ({validationResult.contract?.marginSettings.maxLeverage}x max)</div>
                  <div><strong>Maintenance Margin:</strong> {(validationResult.contract!.marginSettings.maintenanceMarginPct * 100).toFixed(1)}%</div>
                  <div><strong>Initial Margin:</strong> {(validationResult.contract!.marginSettings.initialMarginPct * 100).toFixed(1)}%</div>
                  <div><strong>Taker / Maker:</strong> {validationResult.contract?.feeSchedule.takerFeeBps} bps / {validationResult.contract?.feeSchedule.makerFeeBps} bps</div>
                </div>
                {activationMessage && (
                  <div className="p-2 rounded bg-emerald-900/30 text-emerald-300 text-xs border border-emerald-700/50">
                    {activationMessage}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-rose-950/20 border border-rose-500/40 rounded-xl p-4 text-xs space-y-3">
                <div className="flex items-center space-x-2 text-rose-400 font-bold">
                  <XCircle className="h-5 w-5 text-rose-400" />
                  <span>ACTIVATION BLOCKED (VALIDATION FAILED)</span>
                </div>
                <p className="text-rose-200/90 text-xs font-medium">
                  Missing required fields or invalid mathematical boundaries detected. This contract cannot be activated into live trading:
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {validationResult.errors.map((err, idx) => (
                    <div key={idx} className="bg-slate-950/90 p-2.5 rounded-lg border border-rose-900/60 font-mono text-[11px]">
                      <div className="text-amber-400 font-semibold mb-0.5">Path: {err.path || 'root'}</div>
                      <div className="text-rose-300">{err.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Brief Requirement:</strong> "Store instrument identity, price source, precision, fee and funding schedules, margin mode and supported actions in a typed, validated schema. Missing fields block activation."
          </div>
        </div>
      </div>
    </div>
  );
};
