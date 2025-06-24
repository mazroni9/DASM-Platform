'use client';

import React from 'react';

interface YouTubeBroadcastPlayerProps {
    videoId: string;
    width?: string | number;
    height?: string | number;
    autoplay?: boolean;
}

const YouTubeBroadcastPlayer: React.FC<YouTubeBroadcastPlayerProps> = ({
    videoId,
    width = '100%',
    height = '100%',
    autoplay = true
}) => {
    return (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                    width: width,
                    height: height,
                    border: 'none'
                }}
            />
        </div>
    );
};

export default YouTubeBroadcastPlayer; 