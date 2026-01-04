import React, { useState, useEffect } from 'react';
import { Upload, X, Video } from 'lucide-react';

interface VideoBackgroundProps {
  fallbackBackground?: string;
  overlayOpacity?: number;
  theme?: 'light' | 'dark';
  isAdmin?: boolean;
}

export default function VideoBackground({
  fallbackBackground = 'var(--bg-main)',
  overlayOpacity = 0.4,
  theme = 'dark',
  isAdmin = false
}: VideoBackgroundProps) {
  const [videoFile, setVideoFile] = useState<string | null>(() => {
    return localStorage.getItem('smartroom_video_bg');
  });

  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('smartroom_video_bg');
    if (stored && stored.startsWith('blob:')) {
      setVideoFile(null);
      localStorage.removeItem('smartroom_video_bg');
    }
  }, []);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoFile(url);
      localStorage.setItem('smartroom_video_bg', url);
    }
  };

  const handleRemove = () => {
    setVideoFile(null);
    localStorage.removeItem('smartroom_video_bg');
  };

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
          {videoFile ? (
            <video
              src={videoFile}
              autoPlay
              loop
              muted
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

      {/* Styled Upload Controls - Only visible for Admin */}
      {isAdmin && (
        <div
          style={{
            position: 'fixed',
            bottom: '30px',
            left: '30px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '12px',
            fontFamily: 'sans-serif',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button
            onClick={() => document.getElementById('video-upload')?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              backgroundColor: theme === 'light' ? '#1a759f' : '#fb6f92',
              backdropFilter: 'blur(10px)',
              border: theme === 'light' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '24px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              width: isHovered || !videoFile ? 'auto' : '50px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              justifyContent: isHovered || !videoFile ? 'flex-start' : 'center'
            }}
            title={!isHovered && videoFile ? "העלאת רקע" : ""}
            className="hover:opacity-90 active:scale-95"
          >
            <Upload size={20} />
            {(isHovered || !videoFile) && <span>{videoFile ? 'החלף וידאו' : 'העלה וידאו רקע'}</span>}
          </button>

          <input
            id="video-upload"
            type="file"
            accept="video/*"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />

          {videoFile && (
            <button
              onClick={handleRemove}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 18px',
                backgroundColor: 'rgba(239, 68, 68, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                transition: 'all 0.3s ease',
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'translateY(0)' : 'translateY(10px)',
                pointerEvents: isHovered ? 'auto' : 'none',
                visibility: isHovered ? 'visible' : 'hidden',
                height: isHovered ? 'auto' : 0,
                overflow: 'hidden',
                margin: isHovered ? '0' : '-10px 0 0 0'
              }}
            >
              <X size={16} />
              <span>חזור לרקע רגיל</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}
