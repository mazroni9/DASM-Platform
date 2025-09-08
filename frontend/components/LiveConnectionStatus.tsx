'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import PusherService from '@/lib/pusherService';

interface LiveConnectionStatusProps {
  className?: string;
  showText?: boolean;
}

export default function LiveConnectionStatus({ 
  className = '', 
  showText = true 
}: LiveConnectionStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const pusherService = PusherService.getInstance();
    
    const updateStatus = () => {
      const status = pusherService.getConnectionState();
      setConnectionStatus(status);
    };

    // Initial status check
    updateStatus();

    // Check status every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          text: 'متصل مباشرة',
          pulse: false
        };
      case 'connecting':
        return {
          icon: Wifi,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          text: 'جاري الاتصال...',
          pulse: true
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          text: 'غير متصل',
          pulse: false
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          text: 'حالة غير معروفة',
          pulse: false
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  if (!isVisible) return null;

  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${config.bgColor} ${config.color} ${className}`}
      title={`حالة الاتصال المباشر: ${config.text}`}
    >
      <IconComponent 
        className={`h-3 w-3 ${config.pulse ? 'animate-pulse' : ''}`} 
      />
      {showText && (
        <span className="whitespace-nowrap">
          {config.text}
        </span>
      )}
      
      {/* Auto-hide after 3 seconds for connected status */}
      {connectionStatus === 'connected' && (
        <button
          onClick={() => setIsVisible(false)}
          className="ml-1 hover:opacity-70 transition-opacity"
          title="إخفاء"
        >
          ×
        </button>
      )}
    </div>
  );
}
