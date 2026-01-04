import React from 'react';

interface VideoBackgroundProps {
  videoSrc: string | null;
  fallbackBackground?: string;
  overlayOpacity?: number;
}

export default function VideoBackground({
  videoSrc,
  fallbackBackground = 'var(--bg-main)',
  overlayOpacity = 0.4,
}: VideoBackgroundProps) {

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
        {videoSrc ? (
          <video
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: fallbackBackground.startsWith('http') || fallbackBackground.startsWith('/') ? `url(${fallbackBackground})` : undefined,
              backgroundColor: !fallbackBackground.startsWith('http') && !fallbackBackground.startsWith('/') ? fallbackBackground : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}></div>
      </div>
    </div>
  );
}
