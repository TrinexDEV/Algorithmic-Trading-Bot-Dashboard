export type AssetType = 'crypto' | 'forex' | 'stock' | 'metal';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  currentPrice: number;
  change24h: number; // percentage change
}

export interface TradingPosition {
  id: string;
  assetId: string;
  name: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  pnl: number;
  pnlPercent: number;
  timestamp: string;
  provider: 'JIFO' | 'FTMO' | 'Simulated';
}

export interface TradeLog {
  id: string;
  assetId: string;
  name: string;
  type: 'BUY' | 'SELL' | 'CLOSE_TP' | 'CLOSE_SL' | 'CLOSE_MANUAL' | 'CLOSE_STRATEGY';
  price: number;
  quantity: number;
  pnl: number;
  timestamp: string;
  provider: 'JIFO' | 'FTMO' | 'Simulated';
  details?: string;
}

export interface BotConfig {
  isActive: boolean;
  selectedAssets: string[];
  strategyId: 'rsi_divergence' | 'macd_trend' | 'ema_crossover' | 'bollinger_mean_reversion' | 'stochastic_oscillator' | 'ichimoku_cloud';
  indicators: {
    rsi: {
      period: number;
      overbought: number;
      oversold: number;
    };
    macd: {
      fastPeriod: number;
      slowPeriod: number;
      signalPeriod: number;
    };
    emaCross: {
      fastPeriod: number;
      slowPeriod: number;
    };
    bollinger: {
      period: number;
      stdDev: number;
    };
    stochastic: {
      kPeriod: number;
      dPeriod: number;
      overbought: number;
      oversold: number;
    };
    ichimoku: {
      tenkanPeriod: number;
      kijunPeriod: number;
      senkouBPeriod: number;
    };
  };
  risk: {
    maxDailyDrawdownPercent: number;
    dailyLossLimitUSD: number;
    weeklyLossLimitUSD: number;
    stopLossPercent: number;
    takeProfitPercent: number;
    positionSizePercent: number; // percentage of account balance/equity to risk per trade
    maxConcurrentTrades: number;
    trailingStop: boolean;
    positionSizingBase: 'balance' | 'equity';
  };
  providers: {
    jifo: {
      apiKey: string;
      apiSecret: string;
      isDemo: boolean;
      isConnected: boolean;
    };
    ftmo: {
      accountNumber: string;
      apiToken: string;
      server: string;
      isDemo: boolean;
      isConnected: boolean;
    };
  };
}

export interface BotPerformance {
  balance: number;
  equity: number;
  initialBalance: number;
  totalProfit: number;
  totalLoss: number;
  winRate: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  dailyStartingBalance: number;
  dailyLossTotal: number;
  weeklyLossTotal: number;
}

export interface BacktestResult {
  metrics: {
    initialBalance: number;
    finalBalance: number;
    netProfit: number;
    netProfitPercent: number;
    totalTrades: number;
    winRate: number;
    maxDrawdownPercent: number;
    sharpeRatio: number;
  };
  trades: {
    assetId: string;
    type: 'BUY' | 'SELL';
    entryPrice: number;
    exitPrice: number;
    entryTime: string;
    exitTime: string;
    pnl: number;
    pnlPercent: number;
    exitReason: 'TP' | 'SL' | 'STRATEGY';
  }[];
  equityCurve: {
    time: string;
    equity: number;
  }[];
}
