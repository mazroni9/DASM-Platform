'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Users, Clock, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import CurrentCar from './components/CurrentCar';
import OnlineBids from './components/OnlineBids';
import SpeechToText from './components/SpeechToText';
import UpcomingCars from './components/UpcomingCars';
import AuctionControls from './components/AuctionControls';
import LiveStats from './components/LiveStats';
import { WebSocketProvider, useWebSocket } from '@/app/lib/websocket-provider';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AuctioneerPage() {
  return (
    <WebSocketProvider>
      <AuctioneerDashboard />
    </WebSocketProvider>
  );
}

function AuctioneerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [transcribedText, setTranscribedText] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  const {
    currentCar,
    upcomingCars,
    bids,
    auctionStatus,
    stats,
    connected,
    handleNextCar,
    handleEndAuction,
    handleTogglePause
  } = useWebSocket();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'auctioneer' && parsedUser.role !== 'admin') {
        router.push(`/dashboard/${parsedUser.role}`);
        return;
      }

      setUser(parsedUser);
    } catch {
      router.push('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    const now = new Date();
    const format = now.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    setCurrentTime(format);
    const interval = setInterval(() => {
      const t = new Date().toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setCurrentTime(t);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحقق من البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 rtl:space-x-reverse">
            <h1 className="text-2xl font-bold">واجهة المُحرّج</h1>
            <div className={`h-3 w-3 rounded-full ${auctionStatus === 'active' ? 'bg-green-500 animate-pulse' : auctionStatus === 'paused' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            {!connected && (
              <span className="text-red-300 text-xs animate-pulse">غير متصل</span>
            )}
          </div>

          <div className="flex items-center gap-4 rtl:space-x-reverse">
            <div className="flex items-center gap-1">
              <Eye className="h-5 w-5" />
              <span>{stats.viewerCount} مشاهد</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-5 w-5" />
              <span>{stats.bidderCount} مزايد</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-5 w-5" />
              <span>{currentTime}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center text-sm bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <CurrentCar car={currentCar} />
            <AuctionControls
              auctionStatus={auctionStatus}
              onNextCar={handleNextCar}
              onEndAuction={handleEndAuction}
              onTogglePause={handleTogglePause}
            />
            <LiveStats
              viewerCount={stats.viewerCount}
              bidderCount={stats.bidderCount}
              highestBid={currentCar?.current_price || 0}
              bidCount={stats.totalBids}
            />
          </div>

          <div className="lg:col-span-1 space-y-6">
            <OnlineBids bids={bids} />
            <SpeechToText
              onTranscriptionChange={setTranscribedText}
              isActive={auctionStatus === 'active'}
            />
            {transcribedText && (
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-bold text-gray-800 mb-2">النص على الشاشة:</h2>
                <div className="bg-gray-100 p-3 border text-xl font-bold text-center rounded">
                  {transcribedText}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <UpcomingCars cars={upcomingCars} />
          </div>
        </div>
      </main>
    </div>
  );
}
