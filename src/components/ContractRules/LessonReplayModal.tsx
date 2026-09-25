import React, { useState } from 'react';
import { 
  BookOpen, 
  Lock, 
  Users, 
  ShieldCheck, 
  Play, 
  Sparkles, 
  ArrowRight,
  HelpCircle,
  Award
} from 'lucide-react';
import type { ContractDefinition } from '../../core/types/contract';
import { globalRecordStore, type LessonSimulationRecord } from '../../core/versioning/recordStore';

interface LessonReplayModalProps {
  contract: ContractDefinition;
  accountEquity: number;
}

export const LessonReplayModal: React.FC<LessonReplayModalProps> = ({
  contract,
  accountEquity,
}) => {
  const [simulations, setSimulations] = useState<LessonSimulationRecord[]>(
    globalRecordStore.getLessonSimulations()
  );
  const [activeStep, setActiveStep] = useState<number>(1);
  const [simulatedSize, setSimulatedSize] = useState<number>(2.5);

  const handleRunSimulation = () => {
    const feeBps = contract.feeSchedule.takerFeeBps;
    const notional = simulatedSize * 150;
    const calculatedFee = notional * (feeBps / 10000);
    const initialMargin = notional * contract.marginSettings.initialMarginPct;

    const newRecord: LessonSimulationRecord = {
      lessonId: `LESSON-SIM-${Date.now().toString(36).toUpperCase()}`,
      lessonTitle: `First-Trade Carry & Margin Simulation on ${contract.identity.id}`,
      stepNumber: activeStep,
      explanation: `Simulated under active rule version ${contract.fundingSchedule.ruleVersion}. 4h-8h funding schedule ensures risk parameters scale gracefully.`,
      ruleVersionUsed: contract.fundingSchedule.ruleVersion,
      contractId: contract.identity.id,
      calculatedFee,
      calculatedInitialMargin: initialMargin,
      timestamp: Date.now(),
    };

    globalRecordStore.addLessonSimulation(newRecord);
    setSimulations(globalRecordStore.getLessonSimulations());
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Community Lesson Simulations & Sandbox</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            First-trade understanding and risk tutorials. Designed to run in shared community rooms while guaranteeing zero exposure of private account balances.
          </p>
        </div>

        {/* Privacy Isolation Guarantee Banner */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-700/50 text-indigo-300 text-xs">
          <Lock className="h-4 w-4 text-indigo-400 shrink-0" />
          <span>
            <strong>Isolated Sandbox:</strong> Real Account (${accountEquity.toFixed(2)}) is decoupled & protected.
          </span>
        </div>
      </div>

      {/* Interactive Simulation Walkthrough */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Step Guide */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Interactive Lesson: Understanding Contract Guardrails</span>
          </h3>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300">Step 1: Contract Rules Discovery</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Version {contract.fundingSchedule.ruleVersion}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                When trading <strong>{contract.identity.name}</strong>, leverage is strictly capped at {contract.marginSettings.maxLeverage}x with a {(contract.marginSettings.initialMarginPct * 100).toFixed(0)}% initial margin requirement.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300">Step 2: Funding Rate Protection</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Every {contract.fundingSchedule.intervalHours} Hours
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Funding rate is bounded between {contract.fundingSchedule.floorRateBps} bps and +{contract.fundingSchedule.capRateBps} bps. Active rate: {contract.fundingSchedule.currentRateBps} bps.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300">Step 3: Sandbox Trade Replay</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">
                  No Risk Simulation
                </span>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="number"
                  value={simulatedSize}
                  onChange={(e) => setSimulatedSize(parseFloat(e.target.value) || 1)}
                  className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                />
                <span className="text-slate-400 text-xs">{contract.identity.baseAsset}</span>
                <button
                  onClick={handleRunSimulation}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-bold text-xs flex items-center space-x-1 ml-auto"
                >
                  <Play className="h-3 w-3 fill-slate-950" />
                  <span>Simulate in Shared Room</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Shared Replay Feed */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center space-x-1.5">
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              <span>Community Simulation Logs (Isolated from Account)</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Public Room</span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {simulations.map((sim, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1 font-mono">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-indigo-300 font-sans">{sim.lessonTitle}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                    Rule {sim.ruleVersionUsed}
                  </span>
                </div>
                <p className="text-slate-300 font-sans text-[11px]">{sim.explanation}</p>
                <div className="flex justify-between text-slate-400 text-[10px] pt-1 border-t border-slate-900">
                  <span>Simulated Fee: ${sim.calculatedFee.toFixed(3)}</span>
                  <span>Simulated Margin: ${sim.calculatedInitialMargin.toFixed(2)}</span>
                  <span>{new Date(sim.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
