'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { PriceWithIcon } from '../ui/priceWithIcon';
import LoadingLink from '../LoadingLink';

// Helper function to format the countdown timer
const formatTime = (seconds) => {
    if (seconds <= 0) {
        return '00:00:00';
    }
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(Math.floor(seconds % 60)).padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const FixedAuctionCard = ({ auction }) => {
    const [timeRemaining, setTimeRemaining] = useState(0);

    useEffect(() => {
        if (auction.end_time) {
            const interval = setInterval(() => {
                const now = new Date();
                const endDate = new Date(auction.end_time);
                const diff = (endDate.getTime() - now.getTime()) / 1000;
                setTimeRemaining(diff > 0 ? diff : 0);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [auction.end_time]);


    const car = auction.car;

    if (!car) {
        return null; 
    }

    return (
        <div className="bg-card rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
            <div className="relative h-48">
                <Image
                    src={car.images && car.images.length > 0 ? car.images[0] : '/placeholder-icon.png'}
                    alt={`${car.make} ${car.model}`}
                    layout="fill"
                    objectFit="cover"
                />
            </div>
            <div className="p-4">
                <h3 className="text-xl font-bold text-foreground">{car.make} {car.model} - {car.year}</h3>
                
                <div className="mt-4">
                    <div className="flex justify-between items-center text-foreground">
                        <span>سعر الافتتاح</span>
                        <span className="font-bold"><PriceWithIcon price={auction.opening_price} /></span>
                    </div>
                    <div className="flex justify-between items-center text-primary mt-2">
                        <span>أعلى سعر حالي</span>
                        <span className="font-bold text-lg"><PriceWithIcon price={auction.current_bid} /></span>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <div className="text-2xl font-mono bg-border p-2 rounded-lg">
                        {formatTime(timeRemaining)}
                    </div>
                </div>

                <div className="mt-4">
                    <LoadingLink href={`/carDetails/${auction.car_id}`}>
                        <button className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors">
                            المزايدة الآن
                        </button>
                    </LoadingLink>
                </div>
            </div>
        </div>
    );
};

export default FixedAuctionCard;

