"use client";

import Link from "next/link";
import { Building, ExternalLink, Map } from "lucide-react";
import { useState, useEffect } from "react";

type Venue = {
    id: string;
    name: string;
    location: string;
    status: "live" | "upcoming" | "offline";
    nextAuctionDate?: string;
    imageUrl?: string;
};

export default function OtherVenuesGrid() {
    const [venues, setVenues] = useState<Venue[]>([
        {
            id: "venue-1",
            name: "معرض الرياض للسيارات",
            location: "الرياض، العليا",
            status: "live",
            imageUrl: "/venue1.jpg",
        },
        {
            id: "venue-2",
            name: "معرض جدة للسيارات الفاخرة",
            location: "جدة، حي الشاطئ",
            status: "upcoming",
            nextAuctionDate: "2023-11-15T18:00:00",
            imageUrl: "/venue2.jpg",
        },
        {
            id: "venue-3",
            name: "معرض الدمام",
            location: "الدمام، الشاطئ",
            status: "offline",
            nextAuctionDate: "2023-11-20T19:00:00",
            imageUrl: "/venue3.jpg",
        },
    ]);

    // This would be replaced with an actual API call in production
    useEffect(() => {
        // Simulating an API fetch
        // In a real implementation, you would fetch venues from your backend
        // const fetchVenues = async () => {
        //   try {
        //     const response = await fetch('/api/venues');
        //     const data = await response.json();
        //     setVenues(data);
        //   } catch (error) {
        //     console.error('Failed to fetch venues:', error);
        //   }
        // };
        // fetchVenues();
    }, []);

    return (
        <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">معارض أخرى</h2>
                <Link
                    href="/broadcasts"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                    <span className="ml-1">عرض جميع المعارض</span>
                    <ExternalLink className="h-4 w-4" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {venues.map((venue) => (
                    <Link
                        key={venue.id}
                        href={`/broadcasts/${venue.id}`}
                        className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                    >
                        <div
                            className="h-40 bg-gray-200 bg-no-repeat bg-center bg-cover"
                            style={{
                                backgroundImage: venue.imageUrl
                                    ? `url(${venue.imageUrl})`
                                    : "none",
                            }}
                        >
                            {!venue.imageUrl && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Building className="h-12 w-12 text-gray-400" />
                                </div>
                            )}

                            {venue.status === "live" && (
                                <div className="bg-red-600 text-white px-3 py-1 rounded-br-lg inline-block mt-2 ml-2">
                                    بث مباشر الآن
                                </div>
                            )}
                        </div>

                        <div className="p-4">
                            <h3 className="font-bold text-lg mb-1">
                                {venue.name}
                            </h3>

                            <div className="flex items-center text-gray-600 text-sm mb-3">
                                <Map className="h-4 w-4 ml-1" />
                                <span>{venue.location}</span>
                            </div>

                            {venue.status === "upcoming" &&
                                venue.nextAuctionDate && (
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium">
                                            المزاد القادم:{" "}
                                        </span>
                                        <time dateTime={venue.nextAuctionDate}>
                                            {new Date(
                                                venue.nextAuctionDate
                                            ).toLocaleDateString("ar-SA", {
                                                day: "numeric",
                                                month: "long",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </time>
                                    </div>
                                )}

                            {venue.status === "offline" && (
                                <div className="text-sm text-gray-500">
                                    لا يوجد بث مباشر حالياً
                                </div>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
