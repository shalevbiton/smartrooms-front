import React, { useState, useEffect } from 'react';

interface VideoBackgroundProps {
  fallbackBackground?: string;
  overlayOpacity?: number;
}

export default function VideoBackground({ fallbackBackground = 'var(--bg-main)', overlayOpacity = 0.4 }: VideoBackgroundProps) {
  // 1. State to hold the video URL (if uploaded)
  const [videoFile, setVideoFile] = useState<string | null>(() => {
    // Persist across reloads if possible, though blob URLs are session-local.
    // Ideally we would re-create it, but for now we follow the simple pattern
    // and just try to check if we have a saved state or init null.
    return localStorage.getItem('smartroom_video_bg');
  });

  useEffect(() => {
    // Validate stored URL on mount (simple check)
    const stored = localStorage.getItem('smartroom_video_bg');
    if (stored && stored.startsWith('blob:')) {
      // Blob URLs expire on reload, so we effectively clear it if it's a blob
      // Unless we re-upload. For persistent video, we'd need IndexedDB or server upload.
      // For this simple version, we start null if it was a blob.
      setVideoFile(null);
      localStorage.removeItem('smartroom_video_bg');
    }
  }, []);

  // Function triggered when a file is selected
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      // Create a temporary local URL for the file to display it immediately
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
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>

      {/* --- Background Area --- */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>

        {/* The Condition: If videoFile exists, show video. Otherwise, show image/fallback. */}
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

        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}></div>
      </div>

      {/* --- Upload Controls --- */}
      {/* Positioned at bottom-left to be accessible but unobtrusive */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        padding: '15px',
        background: 'rgba(255,255,255,0.9)',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        zIndex: 99999, // Ensure it's on top
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#333' }}>העלאת וידאו רקע</h3>
        <input
          type="file"
          accept="video/*"
          onChange={handleUpload}
          style={{ fontSize: '12px' }}
        />

        {/* Optional Reset Button */}
        {videoFile && (
          <button
            onClick={handleRemove}
            style={{
              marginTop: '5px',
              padding: '5px 10px',
              background: '#ff4d4f',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}>
            חזור לרקע רגיל
          </button>
        )}
      </div>

    </div>
  );
}

