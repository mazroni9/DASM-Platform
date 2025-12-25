'use client';

import React, { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import SessionCard from '@/components/auctions/SessionCard';
import Skeleton from '@mui/material/Skeleton';

interface Owner {
    id: number;
    first_name: string;
    last_name: string;
    venueOwner?: object;
}

interface Session {
    id: number;
    name: string;
    owner: Owner;
}

interface PaginatedResponse {
    data: Session[];
    current_page: number;
    last_page: number;
    total: number;
}

const BrowseLiveSessionsPage = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            setLoading(true);
            try {
                const response = await axios.get<PaginatedResponse>(`/api/sessions/live?page=${page}`);
                setSessions(prev => [...prev, ...response.data.data.data]);
                if (response.data.data.current_page >= response.data.data.last_page) {
                    setHasMore(false);
                }
            } catch (error) {
                console.error('Failed to fetch live sessions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, [page]);

    const loadMore = () => {
        if (!loading && hasMore) {
            setPage(prevPage => prevPage + 1);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-foreground text-center mb-8">جلسات الحراج المباشر</h1>
            
            {sessions.length === 0 && !loading && (
                <div className="text-center text-foreground/70">
                    <p>لا توجد جلسات مزاد مباشر متاحة حاليًا.</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sessions.map(session => (
                    <SessionCard key={session.id} session={session} />
                ))}
                {loading && Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex flex-col space-y-3">
                        <Skeleton variant="rectangular" width="100%" height={200} />
                        <div className="space-y-2">
                            <Skeleton variant="text" width="80%" />
                            <Skeleton variant="text" width="60%" />
                        </div>
                    </div>
                ))}
            </div>

            {hasMore && (
                <div className="text-center mt-8">
                    <button onClick={loadMore} disabled={loading} className="px-6 py-2 bg-primary text-white rounded-lg disabled:bg-gray-400">
                        {loading ? 'جاري التحميل...' : 'تحميل المزيد'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default BrowseLiveSessionsPage;
