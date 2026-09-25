import React from 'react';
import { 
  Flame, 
  Layers, 
  ShieldCheck, 
  History, 
  BookOpen, 
  TrendingUp, 
  Radio, 
  AlertTriangle,
  FileCode2
} from 'lucide-react';
import type { ContractDefinition, ProviderQuote } from '../../core/types/contract';

interface HeaderProps {
  contracts: ContractDefinition[];
  selectedContract: ContractDefinition;
  onSelectContract: (contract: ContractDefinition) => void;
  quote: ProviderQuote;
  activeTab: 'terminal' | 'validator' | 'receipts' | 'lessons' | 'economics';
  setActiveTab: (tab: 'terminal' | 'validator' | 'receipts' | 'lessons' | 'economics') => void;
}

export const ContractRulesHeader: React.FC<HeaderProps> = ({
  contracts,
  selectedContract,
  onSelectContract,
  quote,
  activeTab,
  setActiveTab,
}) => {
  const isFeedLive = quote.status === 'live';

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-medium">Contract studio</h1>

          {/* Contract Switcher */}
          <div className="flex items-center space-x-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            <Layers className="h-4 w-4 text-slate-400 ml-2" />
            <span className="text-xs text-slate-400 hidden md:inline font-medium">Contract:</span>
            <div className="flex space-x-1">
              {contracts.map(c => {
                const isSelected = c.identity.id === selectedContract.identity.id;
                return (
                  <button
                    key={c.identity.id}
                    onClick={() => onSelectContract(c)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{c.identity.id}</span>
                    <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-slate-950/20 text-slate-900' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {c.marginSettings.maxLeverage}x
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Oracle Status & External Links */}
          <div className="flex items-center space-x-3">
            {/* Oracle Feed Health Badge */}
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
              isFeedLive
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30 animate-pulse'
            }`}>
              {isFeedLive ? (
                <Radio className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              )}
              <span className="font-semibold">{isFeedLive ? 'FEED LIVE' : 'FEED INTERRUPTED'}</span>
            </div>

            <div className="hidden sm:flex items-center space-x-2">
              <a href="/" className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                ← Terminal
              </a>
              <a href="/market-night" className="px-2.5 py-1 text-xs font-medium rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors">
                Market Night
              </a>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-t border-slate-800/60 pt-1 -mb-px overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'terminal'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Trading Terminal</span>
          </button>

          <button
            onClick={() => setActiveTab('validator')}
            className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'validator'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode2 className="h-3.5 w-3.5" />
            <span>Contract Studio & Schema Validator</span>
          </button>

          <button
            onClick={() => setActiveTab('receipts')}
            className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'receipts'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Versioned Receipts Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('lessons')}
            className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'lessons'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Community Lesson Replay</span>
          </button>

          <button
            onClick={() => setActiveTab('economics')}
            className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'economics'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Proof & Economics</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default ContractRulesHeader;
