
import React, { useState, useEffect } from 'react';
import { Booking, Room } from '../types';
import { Calendar, Clock, MapPin, User, X, Play, Loader2, AlertCircle } from 'lucide-react';

// Removed resolveVideoUrl (IndexedDB) as we now use cloud URLs

interface CheckoutGalleryProps {
  bookings: Booking[];
  rooms: Room[];
}

const CheckoutGallery: React.FC<CheckoutGalleryProps> = ({ bookings, rooms }) => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [videoMap, setVideoMap] = useState<Record<string, string | null>>({});

  // Filter completed bookings that have a video
  const galleryItems = bookings.filter(
    (b) => b.status === 'COMPLETED' && b.checkoutVideoUrl
  ).sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());

  useEffect(() => {
    // Direct URL mapping for cloud storage
    const map: Record<string, string | null> = {};
    galleryItems.forEach(item => {
      const url = item.checkoutVideoUrl;
      // Only accept valid HTTP(S) URLs. Old 'local-v-' IDs will be treated as null (not found)
      map[item.id] = (url && url.startsWith('http')) ? url : null;
    });
    setVideoMap(map);
  }, [bookings]);

  const getRoomName = (roomId: string) => rooms.find((r) => r.id === roomId)?.name || 'חדר לא ידוע';

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-primary">גלריית סיום שימוש (וידאו)</h2>
        <p className="text-secondary text-sm md:text-base">
          צפה בסרטונים שהועלו על ידי משתמשים בעת סיום השימוש בחדרים.
        </p>
      </div>

      {galleryItems.length === 0 ? (
        <div className="bg-surface rounded-xl p-12 text-center border border-dashed border-subtle">
          <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4 text-secondary">
            <Play size={32} />
          </div>
          <h3 className="text-lg font-medium text-primary">אין סרטונים בגלריה</h3>
          <p className="text-secondary mt-1">סרטונים יופיעו כאן כאשר משתמשים יעלו אותם בסיום הפגישה.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryItems.map((item) => {
            const resolvedUrl = videoMap[item.id];
            // undefined = loading, null = not found, string = found
            const isLoading = resolvedUrl === undefined;
            const isError = resolvedUrl === null;

            return (
              <div key={item.id} className="bg-surface rounded-xl border border-subtle overflow-hidden shadow-sm hover:shadow-md transition-all group">
                <div
                  className={`h-48 overflow-hidden relative bg-black ${!isError && !isLoading ? 'cursor-pointer' : ''}`}
                  onClick={() => resolvedUrl && setSelectedVideo(resolvedUrl)}
                >
                  {!isLoading && !isError && (
                    <video src={resolvedUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                  )}

                  {isLoading && (
                    <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-white/20" /></div>
                  )}

                  {isError && (
                    <div className="flex flex-col items-center justify-center h-full text-white/40">
                      <AlertCircle size={32} />
                      <span className="text-xs font-bold mt-2">הוידאו לא נמצא</span>
                    </div>
                  )}

                  {!isLoading && !isError && (
                    <div className="absolute inset-0 flex items-center justify-center transition-colors">
                      <div className="bg-brand text-white p-3 rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                        <Play size={24} fill="currentColor" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-primary line-clamp-1">{item.title}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-secondary mt-1">
                        <MapPin size={12} className="text-brand" />
                        <span>{getRoomName(item.roomId)}</span>
                      </div>
                    </div>
                    <div className="bg-brand/10 text-brand text-[10px] font-bold px-2 py-1 rounded-full uppercase border border-brand/20">הסתיים</div>
                  </div>

                  <div className="border-t border-subtle mt-3 pt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <User size={14} className="text-brand" />
                      <span className="truncate">{item.userName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <Calendar size={14} className="text-brand" />
                      <span className="truncate">{new Date(item.endTime).toLocaleDateString('he-IL')}</span>
                      <Clock size={14} className="text-brand mr-1" />
                      <span>{new Date(item.endTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedVideo && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedVideo(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors z-30" onClick={() => setSelectedVideo(null)}>
            <X size={24} />
          </button>
          <div className="w-full max-w-4xl relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <video src={selectedVideo} controls autoPlay className="w-full h-full" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutGallery;
