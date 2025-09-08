import { useEffect, useCallback, useRef } from 'react';
import PusherService from '@/lib/pusherService';
import toast from 'react-hot-toast';

interface LiveMarketData {
  marketCars: any[];
  currentCar: any[];
  marketCarsCompleted: any[];
}

interface UseLiveMarketUpdatesProps {
  onBidUpdate: (auctionId: number, newBid: number, bidderInfo?: any) => void;
  onAuctionStatusChange: (auctionId: number, status: string) => void;
  onPriceChange: (auctionId: number, newPrice: number) => void;
  onDataUpdate: (data: LiveMarketData) => void;
  enabled?: boolean;
}

export const useLiveMarketUpdates = ({
  onBidUpdate,
  onAuctionStatusChange,
  onPriceChange,
  onDataUpdate,
  enabled = true
}: UseLiveMarketUpdatesProps) => {
  const pusherService = useRef(PusherService.getInstance());
  const subscribedChannels = useRef<Set<string>>(new Set());

  const handleNewBid = useCallback((data: any) => {
    console.log('New bid received:', data);
    
    if (data.data?.active_auction) {
      const auction = data.data.active_auction;
      const auctionId = auction.id;
      const newBid = auction.current_bid || auction.opening_price;
      
      onBidUpdate(auctionId, newBid, {
        totalBids: data.data.total_bids,
        timestamp: new Date().toISOString()
      });

      // Show notification for new bids
      toast.success(`مزايدة جديدة: ${newBid.toLocaleString()} ريال`, {
        duration: 3000,
        position: 'top-right',
      });
    }
  }, [onBidUpdate]);

  const handleAuctionStatusChange = useCallback((data: any) => {
    console.log('Auction status changed:', data);
    
    if (data.auction_id && data.status) {
      onAuctionStatusChange(data.auction_id, data.status);
      
      // Show notification for status changes
      const statusMessages = {
        'live': 'بدأ المزاد',
        'completed': 'انتهى المزاد',
        'paused': 'توقف المزاد مؤقتاً'
      };
      
      const message = statusMessages[data.status as keyof typeof statusMessages] || 'تغير حالة المزاد';
      toast.info(message, {
        duration: 4000,
        position: 'top-right',
      });
    }
  }, [onAuctionStatusChange]);

  const handlePriceChange = useCallback((data: any) => {
    console.log('💰 Price changed:', data);
    
    if (data.auction_id && data.new_price) {
      onPriceChange(data.auction_id, data.new_price);
    }
  }, [onPriceChange]);

  const handleLiveMarketUpdate = useCallback((data: any) => {
    console.log('Live market data updated:', data);
    
    if (data.marketCars || data.currentCar || data.marketCarsCompleted) {
      onDataUpdate({
        marketCars: data.marketCars || [],
        currentCar: data.currentCar || [],
        marketCarsCompleted: data.marketCarsCompleted || []
      });
    }
  }, [onDataUpdate]);

  const subscribeToAuctionChannel = useCallback((auctionId: number) => {
    if (!enabled) return;
    
    const channelName = `auction.${auctionId}`;
    
    if (subscribedChannels.current.has(channelName)) {
      return;
    }

    pusherService.current.bindToEvent(channelName, 'NewBidEvent', handleNewBid);
    pusherService.current.bindToEvent(channelName, 'AuctionStatusChanged', handleAuctionStatusChange);
    pusherService.current.bindToEvent(channelName, 'PriceChanged', handlePriceChange);
    
    subscribedChannels.current.add(channelName);
  }, [enabled, handleNewBid, handleAuctionStatusChange, handlePriceChange]);

  const subscribeToLiveMarketChannel = useCallback(() => {
    if (!enabled) return;
    
    const channelName = 'live-market';
    
    if (subscribedChannels.current.has(channelName)) {
      return;
    }

    pusherService.current.bindToEvent(channelName, 'LiveMarketUpdate', handleLiveMarketUpdate);
    pusherService.current.bindToEvent(channelName, 'NewBidEvent', handleNewBid);
    
    subscribedChannels.current.add(channelName);
  }, [enabled, handleLiveMarketUpdate, handleNewBid]);

  const unsubscribeFromChannel = useCallback((channelName: string) => {
    pusherService.current.unbindFromEvent(channelName, 'NewBidEvent');
    pusherService.current.unbindFromEvent(channelName, 'AuctionStatusChanged');
    pusherService.current.unbindFromEvent(channelName, 'PriceChanged');
    pusherService.current.unbindFromEvent(channelName, 'LiveMarketUpdate');
    
    pusherService.current.unsubscribeFromChannel(channelName);
    subscribedChannels.current.delete(channelName);
  }, []);

  const getConnectionStatus = useCallback(() => {
    return pusherService.current.getConnectionState();
  }, []);

  // Subscribe to live market updates
  useEffect(() => {
    if (enabled) {
      subscribeToLiveMarketChannel();
    }

    return () => {
      if (enabled) {
        unsubscribeFromChannel('live-market');
      }
    };
  }, [enabled, subscribeToLiveMarketChannel, unsubscribeFromChannel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subscribedChannels.current.forEach(channelName => {
        unsubscribeFromChannel(channelName);
      });
    };
  }, [unsubscribeFromChannel]);

  return {
    subscribeToAuctionChannel,
    unsubscribeFromChannel,
    getConnectionStatus,
    isConnected: getConnectionStatus() === 'connected'
  };
};
