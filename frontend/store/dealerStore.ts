// store/dealerStore.ts
import { create } from "zustand";

export interface WalletState {
  availableBalance: number;
  fundedBalance: number;
  onHold: number;
  creditLimit: number;
}

export interface Auction {
  id: number;
  car_id: number;
  current_bid: number;
  end_time: string;
  auction_type: string;
  extended_until: string | null;
  car?: {
    id: number;
    brand: string;
    model: string;
    year: number;
    image: string;
    images: string[];
  };
}

export interface AiRecommendation {
  vehicleId: number;
  name: string;
  discountPercentage: number;
  reason: string;
  confidenceScore: number;
  currentPrice: number;
  marketPrice: number;
  timestamp: string;
}

export interface DealerState {
  // Connection
  isConnected: boolean;
  latencyMs: number;

  // User
  userId: number | null;
  userName: string;
  planType: string;
  aiEnabled: boolean;

  // Wallet
  wallet: WalletState;

  // Auctions
  activeAuctions: Auction[];

  // AI Sniper
  aiRecommendations: AiRecommendation[];

  // Actions
  setConnectionStatus: (connected: boolean, latency?: number) => void;
  setUser: (
    userId: number,
    name: string,
    planType: string,
    aiEnabled: boolean,
  ) => void;
  setWallet: (wallet: Partial<WalletState>) => void;
  updateAuctionPrice: (
    auctionId: number,
    price: number,
    endTime?: string,
  ) => void;
  setActiveAuctions: (auctions: Auction[]) => void;
  addAiRecommendation: (recommendation: AiRecommendation) => void;
  clearAiRecommendations: () => void;
  toggleAi: (enabled: boolean) => void;
  optimisticBid: (auctionId: number, amount: number) => void;
}

export const useDealerStore = create<DealerState>((set) => ({
  // Initial state
  isConnected: false,
  latencyMs: 0,
  userId: null,
  userName: "",
  planType: "PRO",
  aiEnabled: false,
  wallet: {
    availableBalance: 0,
    fundedBalance: 0,
    onHold: 0,
    creditLimit: 50000,
  },
  activeAuctions: [],
  aiRecommendations: [],

  // Actions
  setConnectionStatus: (connected, latency = 0) =>
    set({ isConnected: connected, latencyMs: latency }),

  setUser: (userId, name, planType, aiEnabled) =>
    set({ userId, userName: name, planType, aiEnabled }),

  setWallet: (walletUpdate) =>
    set((state) => ({
      wallet: { ...state.wallet, ...walletUpdate },
    })),

  updateAuctionPrice: (auctionId, price, endTime) =>
    set((state) => ({
      activeAuctions: state.activeAuctions.map((auction) =>
        auction.id === auctionId
          ? {
              ...auction,
              current_bid: price,
              ...(endTime && { end_time: endTime }),
            }
          : auction,
      ),
    })),

  setActiveAuctions: (auctions) => set({ activeAuctions: auctions }),

  addAiRecommendation: (recommendation) =>
    set((state) => ({
      aiRecommendations: [
        recommendation,
        ...state.aiRecommendations.slice(0, 9),
      ],
    })),

  clearAiRecommendations: () => set({ aiRecommendations: [] }),

  toggleAi: (enabled) => set({ aiEnabled: enabled }),

  optimisticBid: (auctionId, amount) =>
    set((state) => ({
      activeAuctions: state.activeAuctions.map((auction) =>
        auction.id === auctionId
          ? { ...auction, current_bid: amount }
          : auction,
      ),
      wallet: {
        ...state.wallet,
        availableBalance: state.wallet.availableBalance - amount,
        onHold: state.wallet.onHold + amount,
      },
    })),
}));
