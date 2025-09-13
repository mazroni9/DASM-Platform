'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, User } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface LiveBidNotificationProps {
  bid: {
    amount: number;
    bidder?: string;
    timestamp: string;
    auctionId: number;
  };
  onClose: () => void;
  autoHide?: boolean;
  duration?: number;
}

export default function LiveBidNotification({ 
  bid, 
  onClose, 
  autoHide = true, 
  duration = 5000 
}: LiveBidNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(duration / 1000);

  useEffect(() => {
    if (!autoHide) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsVisible(false);
          setTimeout(onClose, 300); // Allow fade out animation
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoHide, duration, onClose]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-white border-l-4 border-green-500 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-800">
                  مزايدة جديدة
                </span>
                {autoHide && (
                  <span className="text-xs text-gray-500">
                    ({timeLeft}s)
                  </span>
                )}
              </div>
              
              <div className="text-lg font-bold text-green-600 mb-1">
                {formatCurrency(bid.amount)}
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(bid.timestamp)}</span>
                </div>
                
                {bid.bidder && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{bid.bidder}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
