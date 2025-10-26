'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import FixedAuctionCard from '@/components/auctions/FixedAuctionCard';
import Pusher from 'pusher-js';

const FixedAuctionPage = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFixedAuctions = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/auctions/fixed');
        setAuctions(response.data.data.data); // Assuming nested data structure
        setError(null);
      } catch (err) {
        setError('Failed to fetch fixed auctions.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFixedAuctions();

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER!,
    });

    const channel = pusher.subscribe('auction.fixed');

    channel.bind('NewBidEvent', (event: any) => {
        console.log('NewBidEvent received for fixed auction!', event);
        const updatedAuction = event.data.active_auction;
        
        setAuctions(prevAuctions => {
            return prevAuctions.map(auction => {
                if (auction.id === updatedAuction.id) {
                    return { ...auction, ...updatedAuction };
                }
                return auction;
            });
        });
    });

    return () => {
        pusher.unsubscribe('auction.fixed');
        pusher.disconnect();
    };
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl text-white font-bold text-center my-8">المزاد الثابت</h1>
      <p className="text-gray-400 text-center my-4">هذا هو المكان الذي تحصل فيه السيارات الرائعة على فرصة ثانية. السيارات المعروضة هنا لم يتم بيعها في المزادات الأخرى، وتُعرض الآن في مزاد تقليدي بسيط ومحدد بوقت. عندما ينتهي العداد، يفوز صاحب أعلى سعر بالمزاد تلقائياً. إنها فرصتك لاقتناص سيارة أحلامك بسعر رائع.</p>
      
      {loading && <p className="text-center">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {auctions.map((auction) => (
            <FixedAuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FixedAuctionPage;
