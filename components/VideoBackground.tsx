import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Video, Upload, X, AlertCircle } from 'lucide-react';

interface VideoBackgroundProps {
  /** Fallback background color/image if video fails */
  fallbackBackground?: string;
  /** Overlay opacity (0-1) */
  overlayOpacity?: number;
  /** Callback when video source changes */
  onVideoChange?: (videoUrl: string | null) => void;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({
  fallbackBackground = 'var(--bg-main)',
  overlayOpacity = 0.4,
  onVideoChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(() => {
    // Load from localStorage on mount
    // Note: Blob URLs are session-only and won't persist across page reloads
    // If the stored URL is a blob URL, it will be invalid after refresh
    const stored = localStorage.getItem('smartroom_video_bg');
    if (stored && stored.startsWith('blob:')) {
      // Blob URL from previous session is invalid, clear it
      localStorage.removeItem('smartroom_video_bg');
      return null;
    }
    return stored || null;
  });
  const [hasVideoError, setHasVideoError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const previousUrlRef = useRef<string | null>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Cleanup function to revoke URL
  const cleanupVideoUrl = useCallback((url: string | null) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }, []);

  // Load video when URL changes
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    // Set webkit-playsinline for older iOS versions
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('playsinline', 'true');

    // Cleanup previous URL
    if (previousUrlRef.current) {
      cleanupVideoUrl(previousUrlRef.current);
    }

    if (currentVideoUrl && !prefersReducedMotion) {
      video.src = currentVideoUrl;
      video.load();

      // Attempt to play with error handling
      const playPromise = video.play().catch((err) => {
        console.warn('Autoplay blocked or failed:', err);
        setHasVideoError(true);
        // Show play button or fallback
      });

      // Handle play promise
      playPromise.then(() => {
        setHasVideoError(false);
      }).catch(() => {
        setHasVideoError(true);
      });
    } else {
      // Clear video source if reduced motion or no URL
      video.src = '';
      video.load();
    }

    previousUrlRef.current = currentVideoUrl;

    // Notify parent component
    if (onVideoChange) {
      onVideoChange(currentVideoUrl);
    }

    // Cleanup on unmount
    return () => {
      if (currentVideoUrl && currentVideoUrl.startsWith('blob:')) {
        cleanupVideoUrl(currentVideoUrl);
      }
    };
  }, [currentVideoUrl, prefersReducedMotion, cleanupVideoUrl, onVideoChange]);

  // Cleanup on unmount (redundant safety check)
  useEffect(() => {
    return () => {
      // Additional cleanup on unmount - the main cleanup is handled in the effect above
      if (previousUrlRef.current) {
        cleanupVideoUrl(previousUrlRef.current);
      }
    };
  }, []); // Empty deps - only cleanup on unmount

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('אנא בחר קובץ וידאו בלבד');
      return;
    }

    // Validate file size (recommend max 50MB for background videos)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert('קובץ הוידאו גדול מדי. אנא בחר קובץ קטן מ-50MB');
      return;
    }

    // Revoke previous URL if exists
    if (currentVideoUrl && currentVideoUrl.startsWith('blob:')) {
      cleanupVideoUrl(currentVideoUrl);
    }

    // Create new Object URL
    const newUrl = URL.createObjectURL(file);
    setCurrentVideoUrl(newUrl);
    setHasVideoError(false);

    // Save to localStorage (note: blob URLs are session-only)
    // They won't persist across page reloads, but we store them for the current session
    localStorage.setItem('smartroom_video_bg', newUrl);
    
    // Note: For persistent storage across sessions, consider using IndexedDB
    // to store the actual File object, then recreate blob URLs on mount
  };

  const handleRemoveVideo = () => {
    if (currentVideoUrl) {
      cleanupVideoUrl(currentVideoUrl);
    }
    setCurrentVideoUrl(null);
    setHasVideoError(false);
    localStorage.removeItem('smartroom_video_bg');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    if (onVideoChange) {
      onVideoChange(null);
    }
  };

  const handleVideoError = () => {
    setHasVideoError(true);
    console.error('Video failed to load');
  };

  return (
    <>
      {/* Video Background */}
      <div
        className="video-background-container"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          overflow: 'hidden',
          backgroundColor: fallbackBackground
        }}
      >
        {currentVideoUrl && !prefersReducedMotion && !hasVideoError ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="video-background"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              minWidth: '100%',
              minHeight: '100%',
              width: 'auto',
              height: 'auto',
              transform: 'translate(-50%, -50%)',
              objectFit: 'cover',
              opacity: 1
            }}
            onError={handleVideoError}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: fallbackBackground?.startsWith('url') 
                ? fallbackBackground 
                : `url(${fallbackBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        )}

        {/* Overlay for text readability */}
        <div
          className="video-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Upload Controls - OUTSIDE the container to avoid z-index issues */}
      <div
        className="video-upload-controls"
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 99999,
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          pointerEvents: 'auto',
          isolation: 'isolate'
        }}
      >
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="video-upload-input"
          />
          <label
            htmlFor="video-upload-input"
            onClick={(e) => {
              e.stopPropagation();
              // Let the label's htmlFor handle the click, but prevent bubbling
              console.log('Upload button clicked');
            }}
            style={{
              padding: '14px 24px',
              backgroundColor: 'rgba(251, 111, 146, 1)',
              color: 'rgba(255, 255, 255, 1)',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px',
              fontWeight: '700',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
              zIndex: 99999,
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(251, 111, 146, 1)';
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(251, 111, 146, 1)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
            }}
          >
            <Upload size={20} />
            {currentVideoUrl ? 'שנה וידאו' : 'העלה וידאו רקע'}
          </label>

          {currentVideoUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleRemoveVideo();
              }}
              style={{
                padding: '14px 24px',
                backgroundColor: 'rgba(220, 38, 38, 0.95)',
                color: 'white',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '15px',
                fontWeight: '700',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                transition: 'all 0.2s ease',
                pointerEvents: 'auto',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                zIndex: 99999
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 1)';
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.95)';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
              }}
            >
              <X size={20} />
              הסר
            </button>
          )}

          {prefersReducedMotion && currentVideoUrl && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 193, 7, 0.9)',
                color: '#000',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <AlertCircle size={14} />
              וידאו מושהה (העדפת נגישות)
            </div>
          )}
      </div>

      {/* Reduced Motion CSS - pause video */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .video-background {
            animation: none !important;
            transition: none !important;
          }
          .video-background-container video {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default VideoBackground;

