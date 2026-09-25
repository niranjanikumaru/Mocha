import React from 'react';
import { 
  ArrowLeftRight, 
  ShieldAlert, 
  WifiOff, 
  Wifi, 
  GitBranchPlus, 
  Lock, 
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import type { ContractDefinition } from '../../core/types/contract';

interface JudgeDemoBannerProps {
  currentContract: ContractDefinition;
  allContracts: ContractDefinition[];
  onSwitchContract: (contract: ContractDefinition) => void;
  onOpenValidatorWithSample: (sampleType: 'inverted' | 'missing') => void;
  isFeedInterrupted: boolean;
  onToggleFeedInterruption: () => void;
  onPublishRuleUpdate: () => void;
  onOpenLessons: () => void;
}

export const JudgeDemoBanner: React.FC<JudgeDemoBannerProps> = ({
  currentContract,
  allContracts,
  onSwitchContract,
  onOpenValidatorWithSample,
  isFeedInterrupted,
  onToggleFeedInterruption,
  onPublishRuleUpdate,
  onOpenLessons,
}) => {
  const otherContract = allContracts.find(c => c.identity.id !== currentContract.identity.id) || allContracts[0];

  return (
    <div className="bg-slate-900 border-b border-amber-500/30 py-3 px-4 sm:px-6 shadow-inner">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Label */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs uppercase tracking-wider font-extrabold text-amber-400">
              Judge Demonstration Suite:
            </span>
          </div>

          {/* 5 Scenario Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* 1. Switch Contracts */}
            <button
              onClick={() => onSwitchContract(otherContract)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-all group"
              title="Demonstrates dynamic contract schema parsing without modifying screen code"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 text-amber-400 group-hover:rotate-180 transition-transform duration-300" />
              <span>Switch to <strong className="text-white">{otherContract.identity.id}</strong></span>
            </button>

            {/* 2. Reject Invalid Definition */}
            <button
              onClick={() => onOpenValidatorWithSample('inverted')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-200 border border-rose-900/50 flex items-center space-x-1.5 transition-all"
              title="Demonstrates schema engine rejecting invalid contracts before activation"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              <span>Reject Invalid Schema</span>
            </button>

            {/* 3. Interrupt Price Feed */}
            <button
              onClick={onToggleFeedInterruption}
              className={`px-2.5 py-1.5 rounded-lg border flex items-center space-x-1.5 transition-all ${
                isFeedInterrupted
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-300 hover:bg-rose-900/50'
              }`}
              title="Simulates oracle failure: margin health flips to Unavailable and halts unsafe trades"
            >
              {isFeedInterrupted ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Restore Price Feed</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-rose-400" />
                  <span>Interrupt Price Feed</span>
                </>
              )}
            </button>

            {/* 4. Publish Funding Rule v2 */}
            <button
              onClick={onPublishRuleUpdate}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950/40 text-slate-200 border border-cyan-800/50 flex items-center space-x-1.5 transition-all"
              title="Publishes rule v2: new previews adopt updates while historical receipts stay frozen"
            >
              <GitBranchPlus className="h-3.5 w-3.5 text-cyan-400" />
              <span>Publish Rule Update (v2.0)</span>
            </button>

            {/* 5. Account vs Lesson Separation */}
            <button
              onClick={onOpenLessons}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-950/40 text-slate-200 border border-indigo-800/50 flex items-center space-x-1.5 transition-all"
              title="Demonstrates clean isolation between private account equity and public lessons"
            >
              <Lock className="h-3.5 w-3.5 text-indigo-400" />
              <span>Verify Privacy Separation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
