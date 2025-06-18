"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";

interface Car {
    id: number;
    make: string;
    model: string;
    year: number;
    current_price: number;
    images: string[];
}

interface Bid {
    id: number;
    amount: number;
    bidder_name: string;
    created_at: string;
}

interface Stats {
    viewerCount: number;
    bidderCount: number;
    totalBids: number;
}

interface WebSocketContextType {
    currentCar: Car | null;
    upcomingCars: Car[];
    bids: Bid[];
    auctionStatus: "active" | "paused" | "ended";
    stats: Stats;
    connected: boolean;
    handleNextCar: () => void;
    handleEndAuction: () => void;
    handleTogglePause: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
    undefined
);

interface WebSocketProviderProps {
    children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
    const [currentCar, setCurrentCar] = useState<Car | null>(null);
    const [upcomingCars, setUpcomingCars] = useState<Car[]>([]);
    const [bids, setBids] = useState<Bid[]>([]);
    const [auctionStatus, setAuctionStatus] = useState<
        "active" | "paused" | "ended"
    >("active");
    const [stats, setStats] = useState<Stats>({
        viewerCount: 0,
        bidderCount: 0,
        totalBids: 0,
    });
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // Mock WebSocket connection for now
        setConnected(true);

        // Mock data
        setCurrentCar({
            id: 1,
            make: "Toyota",
            model: "Camry",
            year: 2020,
            current_price: 50000,
            images: ["/api/placeholder/400/300"],
        });

        setUpcomingCars([
            {
                id: 2,
                make: "Honda",
                model: "Civic",
                year: 2021,
                current_price: 45000,
                images: ["/api/placeholder/400/300"],
            },
            {
                id: 3,
                make: "Nissan",
                model: "Altima",
                year: 2019,
                current_price: 40000,
                images: ["/api/placeholder/400/300"],
            },
        ]);

        setStats({
            viewerCount: 150,
            bidderCount: 25,
            totalBids: 45,
        });

        // Cleanup function
        return () => {
            setConnected(false);
        };
    }, []);

    const handleNextCar = () => {
        console.log("Moving to next car");
        // Implementation for moving to next car
    };

    const handleEndAuction = () => {
        console.log("Ending auction");
        setAuctionStatus("ended");
    };

    const handleTogglePause = () => {
        console.log("Toggling pause");
        setAuctionStatus((prev) => (prev === "active" ? "paused" : "active"));
    };

    const value: WebSocketContextType = {
        currentCar,
        upcomingCars,
        bids,
        auctionStatus,
        stats,
        connected,
        handleNextCar,
        handleEndAuction,
        handleTogglePause,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error("useWebSocket must be used within a WebSocketProvider");
    }
    return context;
}
