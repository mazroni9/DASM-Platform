'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

// تعريف أنواع البيانات
export interface Car {
  id: number;
  title: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  color: string;
  vin: string;
  condition: string;
  images: string[];
  min_price: number;
  max_price: number;
  current_price: number;
  description: string;
  seller_id: number;
  seller_name?: string;
  status: 'pending' | 'active' | 'sold' | 'unsold';
  created_at: string;
}

export interface Bid {
  id: string;
  car_id: number;
  bidder_id: number;
  bidder_name: string;
  amount: number;
  timestamp: string;
  is_online: boolean;
}

export interface AuctionStats {
  viewerCount: number;
  bidderCount: number;
  totalBids: number;
}

// تعريف الواجهة البرمجية للسياق
interface WebSocketContextType {
  currentCar: Car | null;
  upcomingCars: Car[];
  bids: Bid[];
  auctionStatus: 'waiting' | 'active' | 'paused';
  stats: AuctionStats;
  connected: boolean;
  sendMessage: (message: any) => void;
  handleNextCar: () => void;
  handleEndAuction: (sold: boolean) => void;
  handleTogglePause: () => void;
}

// إنشاء السياق
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// سنستخدم هذا للواجهة التجريبية حتى يتم ربط الخادم الحقيقي
const MOCK_DATA = {
  currentCar: {
    id: 123,
    title: 'تويوتا كامري 2020 فل كامل',
    make: 'تويوتا',
    model: 'كامري',
    year: 2020,
    mileage: 35000,
    color: 'أبيض',
    vin: 'ABC123XYZ456789',
    condition: 'ممتاز',
    images: ['/images/cars/camry1.jpg', '/images/cars/camry2.jpg', '/images/cars/camry3.jpg'],
    min_price: 85000,
    max_price: 110000,
    current_price: 92000,
    description: 'تويوتا كامري 2020 قير أوتوماتيك، فل كامل، ماشي 35 ألف كم، ضمان وصيانة مجانية لدى الوكيل',
    seller_id: 45,
    seller_name: 'معرض الأمانة للسيارات',
    status: 'active',
    created_at: '2023-10-15T08:00:00Z'
  } as Car,
  upcomingCars: [
    // البيانات التجريبية المحددة في الملف الأصلي
  ],
  stats: {
    viewerCount: 213,
    bidderCount: 42,
    totalBids: 28
  }
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentCar, setCurrentCar] = useState<Car | null>(null);
  const [upcomingCars, setUpcomingCars] = useState<Car[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [auctionStatus, setAuctionStatus] = useState<'waiting' | 'active' | 'paused'>('waiting');
  const [stats, setStats] = useState<AuctionStats>({ viewerCount: 0, bidderCount: 0, totalBids: 0 });
  const [connected, setConnected] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  
  // إنشاء اتصال WebSocket عند تحميل المكون
  useEffect(() => {
    // هنا ستكون عنوان الخادم الحقيقي في الإنتاج
    const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://api.dasm-platform.com/ws';
    
    // في بيئة التطوير، سنستخدم بيانات تجريبية
    if (process.env.NODE_ENV === 'development') {
      console.log('تشغيل الوضع التجريبي للبيانات');
      setCurrentCar(MOCK_DATA.currentCar);
      setUpcomingCars(MOCK_DATA.upcomingCars);
      setStats(MOCK_DATA.stats);
      setAuctionStatus('active');
      setConnected(true);
      
      // محاكاة استلام المزايدات كل 15 ثانية
      const bidInterval = setInterval(() => {
        if (currentCar) {
          const newBid: Bid = {
            id: `b${Date.now()}`,
            car_id: currentCar.id,
            bidder_id: 100 + Math.floor(Math.random() * 20),
            bidder_name: `مزايد ${Math.floor(Math.random() * 100)}`,
            amount: currentCar.current_price + (1000 * Math.floor(Math.random() * 3) + 1000),
            timestamp: new Date().toISOString(),
            is_online: Math.random() > 0.5
          };
          
          // تحديث السعر الحالي للسيارة إذا كان العرض الجديد أعلى
          if (newBid.amount > currentCar.current_price) {
            setCurrentCar(prevCar => prevCar ? { ...prevCar, current_price: newBid.amount } : null);
          }
          
          setBids(prev => [newBid, ...prev].slice(0, 20)); // الاحتفاظ بآخر 20 مزايدة فقط
          setStats(prev => ({ ...prev, totalBids: prev.totalBids + 1 }));
        }
      }, 15000);
      
      return () => clearInterval(bidInterval);
    } else {
      // الاتصال بالخادم الحقيقي
      try {
        const socket = new WebSocket(socketUrl);
        socketRef.current = socket;
        
        socket.onopen = () => {
          console.log('تم الاتصال بالخادم');
          setConnected(true);
          
          // إرسال معلومات المستخدم
          const authToken = localStorage.getItem('auth_token');
          if (authToken) {
            socket.send(JSON.stringify({
              type: 'auth',
              token: authToken
            }));
          }
        };
        
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          // معالجة الرسائل المختلفة
          switch (data.type) {
            case 'current_car':
              setCurrentCar(data.car);
              break;
            case 'upcoming_cars':
              setUpcomingCars(data.cars);
              break;
            case 'new_bid':
              setBids(prev => [data.bid, ...prev].slice(0, 20));
              if (data.bid.amount > (currentCar?.current_price || 0)) {
                setCurrentCar(prevCar => prevCar ? { ...prevCar, current_price: data.bid.amount } : null);
              }
              break;
            case 'auction_status':
              setAuctionStatus(data.status);
              break;
            case 'stats':
              setStats(data.stats);
              break;
            default:
              console.log('رسالة غير معروفة:', data);
          }
        };
        
        socket.onclose = () => {
          console.log('تم قطع الاتصال');
          setConnected(false);
        };
        
        socket.onerror = (error) => {
          console.error('خطأ في الاتصال:', error);
          setConnected(false);
        };
        
        // إغلاق الاتصال عند إزالة المكون
        return () => {
          socket.close();
        };
      } catch (error) {
        console.error('فشل في إنشاء اتصال WebSocket:', error);
      }
    }
  }, []);
  
  // إرسال رسالة إلى الخادم
  const sendMessage = (message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('محاولة إرسال رسالة بدون اتصال مفتوح');
    }
  };
  
  // وظائف التحكم في المزاد
  const handleNextCar = () => {
    if (upcomingCars.length > 0) {
      const nextCar = upcomingCars[0];
      setCurrentCar({ ...nextCar, status: 'active', current_price: nextCar.min_price });
      setUpcomingCars(prev => prev.slice(1));
      setBids([]);
      setAuctionStatus('active');
      
      // إرسال الأمر إلى الخادم
      sendMessage({
        type: 'next_car',
        car_id: nextCar.id
      });
    }
  };
  
  const handleEndAuction = (sold: boolean) => {
    if (currentCar) {
      setCurrentCar(prev => prev ? { ...prev, status: sold ? 'sold' : 'unsold' } : null);
      setAuctionStatus('waiting');
      
      // إرسال الأمر إلى الخادم
      sendMessage({
        type: 'end_auction',
        car_id: currentCar.id,
        sold: sold
      });
    }
  };
  
  const handleTogglePause = () => {
    const newStatus = auctionStatus === 'active' ? 'paused' : 'active';
    setAuctionStatus(newStatus);
    
    // إرسال الأمر إلى الخادم
    sendMessage({
      type: 'toggle_pause',
      status: newStatus
    });
  };
  
  // توفير القيم والوظائف للمكونات الفرعية
  const contextValue: WebSocketContextType = {
    currentCar,
    upcomingCars,
    bids,
    auctionStatus,
    stats,
    connected,
    sendMessage,
    handleNextCar,
    handleEndAuction,
    handleTogglePause
  };
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// هوك مخصص لاستخدام السياق
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('يجب استخدام useWebSocket داخل WebSocketProvider');
  }
  return context;
}; 