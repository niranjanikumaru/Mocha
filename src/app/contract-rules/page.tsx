'use client';

import React, { useState, useEffect } from 'react';
import { ContractRulesHeader } from '../../components/ContractRules/ContractRulesHeader';
import { JudgeDemoBanner } from '../../components/ContractRules/JudgeDemoBanner';
import { TradePreview } from '../../components/ContractRules/TradePreview';
import { MarginHealthCard } from '../../components/ContractRules/MarginHealthCard';
import { ActivePositions } from '../../components/ContractRules/ActivePositions';
import { ContractStudioModal } from '../../components/ContractRules/ContractStudioModal';
import { VersionedReceiptsList } from '../../components/ContractRules/VersionedReceiptsList';
import { LessonReplayModal } from '../../components/ContractRules/LessonReplayModal';
import { EconomicsMetrics } from '../../components/ContractRules/EconomicsMetrics';

import { globalCatalogue } from '../../core/catalogue/registry';
import { pythProviderAdapter } from '../../core/adapters/providerAdapter';
import { PerpetualCalculator } from '../../core/calculations/perpetual';
import { globalRecordStore } from '../../core/versioning/recordStore';
import type { 
  ContractDefinition, 
  OrderSide, 
  OrderType, 
  Position, 
  ProviderQuote 
} from '../../core/types/contract';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function ContractRulesPage() {
  const [contracts, setContracts] = useState<ContractDefinition[]>([]);
  const [selectedContract, setSelectedContract] = useState<ContractDefinition | null>(null);
  const [quote, setQuote] = useState<ProviderQuote>(pythProviderAdapter.getQuote());
  const [activeTab, setActiveTab] = useState<'terminal' | 'validator' | 'receipts' | 'lessons' | 'economics'>('terminal');
  const [validatorSample, setValidatorSample] = useState<'valid' | 'inverted' | 'missing'>('valid');

  // Order state
  const [side, setSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [size, setSize] = useState<number>(5.0);
  const [leverage, setLeverage] = useState<number>(10);

  // Account state (Private to user)
  const [accountEquity, setAccountEquity] = useState<number>(10000.00);
  const [availableBalance, setAvailableBalance] = useState<number>(8500.00);
  const [positions, setPositions] = useState<Position[]>([
    {
      id: 'POS-001',
      contractId: 'AERO-PERP',
      side: 'buy',
      size: 10,
      entryPrice: 140.00,
      currentMarkPrice: 142.50,
      leverage: 10,
      marginAllocated: 140.00,
      unrealizedPnl: 25.00,
      unrealizedPnlPct: 17.85,
      liquidationPrice: 129.50,
      fundingAccrued: 0.168,
      marginHealthRatio: 3.5,
    }
  ]);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Initial load
  useEffect(() => {
    const all = globalCatalogue.getAllContracts();
    setContracts(all);
    if (all.length > 0) {
      setSelectedContract(all[0]);
    }
  }, []);

  // Subscribe to catalogue updates
  useEffect(() => {
    return globalCatalogue.subscribe(() => {
      const updated = globalCatalogue.getAllContracts();
      setContracts(updated);
      if (selectedContract) {
        const current = updated.find(c => c.identity.id === selectedContract.identity.id);
        if (current) setSelectedContract(current);
      }
    });
  }, [selectedContract]);

  // Subscribe to provider adapter price stream
  useEffect(() => {
    return pythProviderAdapter.subscribe((newQuote) => {
      setQuote(newQuote);

      if (selectedContract) {
        // Recalculate open positions unrealized PnL
        setPositions(prev => prev.map(p => {
          const evalResult = PerpetualCalculator.evaluatePosition(
            selectedContract,
            p.side,
            p.size,
            p.entryPrice,
            newQuote.markPrice,
            p.marginAllocated,
            newQuote.status
          );
          return {
            ...p,
            currentMarkPrice: newQuote.markPrice,
            unrealizedPnl: evalResult.unrealizedPnl,
            unrealizedPnlPct: evalResult.unrealizedPnlPct,
            marginHealthRatio: evalResult.healthRatio,
          };
        }));
      }
    });
  }, [selectedContract]);

  if (!selectedContract) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-slate-400 font-mono text-sm">Initializing Contract Rules Engine...</div>
      </div>
    );
  }

  // Handle switching contract without UI code changes
  const handleSelectContract = (contract: ContractDefinition) => {
    setSelectedContract(contract);
    setLeverage(Math.min(leverage, contract.marginSettings.maxLeverage));

    const basePrice = contract.identity.id === 'AERO-PERP' ? 142.50 : 28.75;
    pythProviderAdapter.setBasePrice(basePrice, contract.identity.symbol);
    showToast(`Switched to ${contract.identity.name} (${contract.identity.id}). Zero screen code changed!`, 'info');
  };

  // Perform dynamic order calculation
  const orderCalculation = PerpetualCalculator.calculateOrderPreview(
    selectedContract,
    {
      contractId: selectedContract.identity.id,
      side,
      type: orderType,
      size,
      leverage,
    },
    quote.markPrice,
    quote.status,
    { equity: accountEquity, availableBalance }
  );

  // Execute trade: mints cryptographic receipt
  const handleExecuteTrade = () => {
    if (quote.status !== 'live') {
      showToast('Execution blocked: Price feed is interrupted!', 'warning');
      return;
    }

    if (orderCalculation.accountHealthStatus === 'CRITICAL') {
      showToast('Execution blocked: Margin requirements breached!', 'warning');
      return;
    }

    const receipt = globalRecordStore.createReceipt({
      contract: selectedContract,
      side,
      size,
      executionPrice: quote.markPrice,
      leverage,
      feedStatus: quote.status,
    });

    // Update account balances
    const newAvailable = availableBalance - orderCalculation.requiredInitialMargin - orderCalculation.estimatedFee;
    setAvailableBalance(Math.max(0, newAvailable));

    // Add to open positions
    const newPosition: Position = {
      id: `POS-${Date.now().toString(36).toUpperCase()}`,
      contractId: selectedContract.identity.id,
      side,
      size,
      entryPrice: quote.markPrice,
      currentMarkPrice: quote.markPrice,
      leverage,
      marginAllocated: orderCalculation.requiredInitialMargin,
      unrealizedPnl: 0,
      unrealizedPnlPct: 0,
      liquidationPrice: orderCalculation.estimatedLiquidationPrice,
      fundingAccrued: 0,
      marginHealthRatio: 4.0,
    };

    setPositions([newPosition, ...positions]);
    showToast(`Order executed! Minted immutable receipt ${receipt.receiptId} under rule ${receipt.ruleVersionSnapshot.fundingSchedule.ruleVersion}.`, 'success');
  };

  const handleClosePosition = (id: string) => {
    const pos = positions.find(p => p.id === id);
    if (!pos) return;
    setAvailableBalance(prev => prev + pos.marginAllocated + pos.unrealizedPnl);
    setPositions(prev => prev.filter(p => p.id !== id));
    showToast(`Closed position ${id}. Margin released.`, 'info');
  };

  // Demo action: toggle price feed interruption
  const handleToggleFeedInterruption = () => {
    if (pythProviderAdapter.isFeedInterrupted()) {
      pythProviderAdapter.restoreFeed();
      showToast('Oracle price feed restored! Heartbeat healthy.', 'success');
    } else {
      pythProviderAdapter.interruptFeed();
      showToast('Feed interrupted! Position health now safely Unavailable.', 'warning');
    }
  };

  // Demo action: publish new rule version
  const handlePublishRuleUpdate = () => {
    const currentVer = selectedContract.fundingSchedule.ruleVersion;
    const newVer = currentVer === 'v1.0.0' ? 'v2.0.0' : 'v2.1.0';

    const result = globalCatalogue.publishRuleUpdate(selectedContract.identity.id, {
      fundingSchedule: {
        ruleVersion: newVer,
        currentRateBps: selectedContract.fundingSchedule.currentRateBps + 15,
      },
      feeSchedule: {
        ruleVersion: newVer,
        takerFeeBps: Math.max(1, selectedContract.feeSchedule.takerFeeBps - 1),
      },
    });

    if (result.success) {
      showToast(`Published rule update ${newVer} on ${selectedContract.identity.id}. New order previews updated; historical receipts preserved!`, 'success');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold flex items-center space-x-2.5 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : toast.type === 'warning'
              ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
              : 'bg-slate-900/90 border-slate-700 text-white'
          }`}>
            {toast.type === 'success' ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4 text-amber-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <ContractRulesHeader
        contracts={contracts}
        selectedContract={selectedContract}
        onSelectContract={handleSelectContract}
        quote={quote}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Judge Demonstration Controls Bar */}
      <JudgeDemoBanner
        currentContract={selectedContract}
        allContracts={contracts}
        onSwitchContract={handleSelectContract}
        onOpenValidatorWithSample={(sample) => {
          setValidatorSample(sample);
          setActiveTab('validator');
        }}
        isFeedInterrupted={pythProviderAdapter.isFeedInterrupted()}
        onToggleFeedInterruption={handleToggleFeedInterruption}
        onPublishRuleUpdate={handlePublishRuleUpdate}
        onOpenLessons={() => setActiveTab('lessons')}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'terminal' && (
          <div className="space-y-6">
            {/* Top Grid: Trade Preview & Margin Health Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <TradePreview
                  contract={selectedContract}
                  quote={quote}
                  calculation={orderCalculation}
                  side={side}
                  setSide={setSide}
                  orderType={orderType}
                  setOrderType={setOrderType}
                  size={size}
                  setSize={setSize}
                  leverage={leverage}
                  setLeverage={setLeverage}
                  onExecuteTrade={handleExecuteTrade}
                />
              </div>

              <div className="lg:col-span-5">
                <MarginHealthCard
                  calculation={orderCalculation}
                  quote={quote}
                  accountEquity={accountEquity}
                />
              </div>
            </div>

            {/* Bottom: Active Open Positions */}
            <ActivePositions
              positions={positions}
              feedStatus={quote.status}
              onClosePosition={handleClosePosition}
            />
          </div>
        )}

        {activeTab === 'validator' && (
          <ContractStudioModal
            initialSample={validatorSample}
            onContractActivated={() => {
              setContracts(globalCatalogue.getAllContracts());
              showToast('Contract activated into catalogue!', 'success');
            }}
          />
        )}

        {activeTab === 'receipts' && (
          <VersionedReceiptsList
            receipts={globalRecordStore.getReceipts()}
          />
        )}

        {activeTab === 'lessons' && (
          <LessonReplayModal
            contract={selectedContract}
            accountEquity={accountEquity}
          />
        )}

        {activeTab === 'economics' && (
          <EconomicsMetrics />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MochaTrade Architecture Prototype • Section 3: Scalability through validated contract rules</span>
          <span>Strict Schema Guardrails Active</span>
        </div>
      </footer>
    </div>
  );
}
