'use client';

// ❌ تم تعليق المكونات المفقودة مؤقتًا لتجنب أخطاء البناء
// import CurrentCar from '@/components/dashboard/CurrentCar';
// import OnlineBids from '@/components/dashboard/OnlineBids';
// import SpeechToText from '@/components/dashboard/SpeechToText';
// import UpcomingCars from '@/components/dashboard/UpcomingCars';
// import AuctionControls from '@/components/dashboard/AuctionControls';
// import LiveStats from '@/components/LiveStats';
// import { WebSocketProvider, useWebSocket } from '@/app/lib/websocket-provider';

import React, { useState, useEffect } from 'react';
import { Eye, Users, Clock, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
// export const fetchCache = 'force-no-store';
// export const revalidate = 0;

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AuctioneerPage() {
  return (
    <>
      {/* <WebSocketProvider> */}
        <AuctioneerDashboard />
      {/* </WebSocketProvider> */}
    </>
  );
}

function AuctioneerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [transcribedText, setTranscribedText] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setCurrentTime(formattedTime);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="text-right text-sm text-gray-500">الوقت الحالي: {currentTime}</div>
      {/* <CurrentCar /> */}
      {/* <OnlineBids /> */}
      {/* <SpeechToText /> */}
      {/* <UpcomingCars /> */}
      {/* <AuctionControls /> */}
      {/* <LiveStats /> */}
    </div>
  );
}
