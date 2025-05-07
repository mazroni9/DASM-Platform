import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // Example mock data - replace with actual database query in production
        const instantAuctions = [
            {
                id: "1",
                title: "Instant Auction Item 1",
                description: "Description for instant auction item 1",
                startingBid: 5000,
                currentBid: 5500,
                endTime: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
            },
            {
                id: "2",
                title: "Instant Auction Item 2",
                description: "Description for instant auction item 2",
                startingBid: 10000,
                currentBid: 12000,
                endTime: new Date(Date.now() + 172800000).toISOString(), // 48 hours from now
            },
        ];

        return NextResponse.json(instantAuctions);
    } catch (error) {
        console.error("Error in instant auctions API:", error);
        return NextResponse.json(
            { error: "حدث خطأ في الخادم" },
            { status: 500 }
        );
    }
}
