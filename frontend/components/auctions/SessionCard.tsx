import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import Image from "next/image";
import { se } from 'date-fns/locale';
import LoadingLink from '../LoadingLink';

interface Owner {
    id: number;
    first_name: string;
    last_name: string;
    logo_url?: string; // Assuming logo_url might be added later
    venueOwner?: {
        venue_name?: string;
        user_id?: number;
        logo_url?: string;
    };
}

interface Session {
    id: number;
    name: string;
    owner: Owner;
}

interface SessionCardProps {
    session: Session;
}

const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
    const ownerName = session.owner.venueOwner?.venue_name || `${session.owner.first_name} ${session.owner.last_name}`;
    const logoUrl = session.owner.venueOwner?.logo_url || '/default_showroom.png'; // Placeholder logo

    return (
        <Card className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg">
            <CardContent className="p-0">
                <div className="relative h-48 w-full">
                    <Image
                        src={logoUrl}
                        alt={`${ownerName} logo`}
                        layout="fill"
                        objectFit="cover"
                        className="bg-border"
                    />
                    <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs font-bold rounded-full flex items-center shadow-md">
                        <span className="relative flex h-2 w-2 mr-2 ml-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        مباشر
                    </div>
                </div>
                <div className="p-4">
                    <h3 className="text-lg font-bold text-foreground">{ownerName}</h3>
                    <p className="text-sm text-foreground">{session.name}</p>
                </div>
            </CardContent>
            <CardFooter className="p-4">
                <LoadingLink href={`/auctions/live-auctions/${session.id}`} passHref>
                    <Button className="w-full">ادخل المزاد</Button>
                </LoadingLink>
            </CardFooter>
        </Card>
    );
};

export default SessionCard;
