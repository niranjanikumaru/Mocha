import type { ProviderQuote, FeedHealthStatus } from '../types/contract';

export interface ProviderCapabilities {
  providerId: string;
  name: string;
  hasMarkPriceStream: boolean;
  hasDirectExecution: boolean;
  hasFundingOracle: boolean;
  supportedSettlements: string[];
}

export type QuoteListener = (quote: ProviderQuote) => void;

export class CapabilityAwareProviderAdapter {
  private capabilities: ProviderCapabilities;
  private currentQuote: ProviderQuote;
  private listeners: QuoteListener[] = [];
  private heartbeatTimer: number | null = null;
  private isInterrupted: boolean = false;
  private basePrice: number;

  constructor(
    capabilities: ProviderCapabilities,
    initialPrice: number,
    symbol: string
  ) {
    this.capabilities = capabilities;
    this.basePrice = initialPrice;
    this.currentQuote = {
      providerId: capabilities.providerId,
      symbol,
      bid: initialPrice * 0.9995,
      ask: initialPrice * 1.0005,
      markPrice: initialPrice,
      lastUpdated: Date.now(),
      status: 'live',
      statusReason: 'Connected to primary oracle heartbeat',
    };

    this.startMockStream();
  }

  public getCapabilities(): ProviderCapabilities {
    return this.capabilities;
  }

  public getQuote(): ProviderQuote {
    return { ...this.currentQuote };
  }

  public isFeedInterrupted(): boolean {
    return this.isInterrupted;
  }

  /**
   * Fault Injection: Interrupts the price feed for judge demonstration
   */
  public interruptFeed(reason: string = 'Oracle heartbeat lost. Upstream consensus timeout.'): void {
    this.isInterrupted = true;
    this.currentQuote = {
      ...this.currentQuote,
      status: 'interrupted',
      statusReason: reason,
      lastUpdated: Date.now() - 45000, // Show stale elapsed time
    };
    this.broadcastQuote();
  }

  /**
   * Restores healthy price feed
   */
  public restoreFeed(): void {
    this.isInterrupted = false;
    this.currentQuote = {
      ...this.currentQuote,
      status: 'live',
      statusReason: 'Heartbeat restored. Verification checks passed.',
      lastUpdated: Date.now(),
    };
    this.broadcastQuote();
  }

  /**
   * Allows setting current base price (e.g. when switching contract symbol)
   */
  public setBasePrice(newPrice: number, newSymbol: string): void {
    this.basePrice = newPrice;
    this.currentQuote = {
      ...this.currentQuote,
      symbol: newSymbol,
      bid: newPrice * 0.9995,
      ask: newPrice * 1.0005,
      markPrice: newPrice,
      lastUpdated: Date.now(),
    };
    this.broadcastQuote();
  }

  public subscribe(listener: QuoteListener): () => void {
    this.listeners.push(listener);
    listener(this.currentQuote);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private broadcastQuote(): void {
    this.listeners.forEach(fn => fn({ ...this.currentQuote }));
  }

  private startMockStream(): void {
    if (typeof window === 'undefined') return;

    setInterval(() => {
      if (this.isInterrupted) return;

      // Small realistic market jitter (+/- 0.08%)
      const jitter = (Math.random() - 0.495) * 0.0016;
      this.basePrice = Math.max(1, this.basePrice * (1 + jitter));

      const spread = this.basePrice * 0.0004;
      this.currentQuote = {
        providerId: this.capabilities.providerId,
        symbol: this.currentQuote.symbol,
        bid: Number((this.basePrice - spread / 2).toFixed(4)),
        ask: Number((this.basePrice + spread / 2).toFixed(4)),
        markPrice: Number(this.basePrice.toFixed(4)),
        lastUpdated: Date.now(),
        status: 'live',
        statusReason: 'Connected to primary oracle heartbeat',
      };

      this.broadcastQuote();
    }, 1500);
  }
}

export const pythProviderAdapter = new CapabilityAwareProviderAdapter(
  {
    providerId: 'mocha_pyth_oracle',
    name: 'Pyth Sub-second Low-Latency Oracle',
    hasMarkPriceStream: true,
    hasDirectExecution: false,
    hasFundingOracle: true,
    supportedSettlements: ['USDC', 'USD'],
  },
  142.50,
  'AERO/USD'
);
