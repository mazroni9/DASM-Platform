'use client';

import React from 'react';
import LiveMarketPageContent from '@/app/auctions/auctions-1main/live-market/LiveMarketPageContent';
import { useParams } from 'next/navigation';

const LiveAuctionSessionPage = () => {
    const params = useParams();
    const sessionId = params.id as string;

    return <LiveMarketPageContent sessionId={sessionId} />;
};

export default LiveAuctionSessionPage;
