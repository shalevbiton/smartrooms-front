
import React, { useState } from 'react';
import { Sparkles, Send, Loader2, Zap } from 'lucide-react';
import { parseBookingRequest } from '../services/geminiService';
import { Room } from '../types';

interface NaturalLanguageInputProps {
  rooms: Room[];
  onResult: (data: any) => void;
}

const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({ rooms, onResult }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const result = await parseBookingRequest(input, rooms);
      if (result && result.roomId) {
        onResult(result);
        setInput('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative mb-10 group">
      {/* Decorative Glow background */}
      <div className="absolute -inset-1 bg-gradient-to-r from-brand via-sky-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
      
      <div className="relative bg-surface/80 backdrop-blur-xl border border-subtle rounded-2xl p-1 shadow-xl">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-1">
          <div className="flex-1 relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand">
              <Sparkles size={18} className={isLoading ? "animate-pulse" : ""} />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='תזמין לי חדר ל-10 אנשים למחר בצהריים...'
              className="w-full pr-12 pl-4 py-4 bg-transparent text-primary placeholder:text-secondary/40 focus:outline-none font-medium"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-brand text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-brand/20 active:scale-95"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
            <span className="hidden sm:inline">שאל את ה-AI</span>
          </button>
        </form>
      </div>

      <div className="flex gap-4 mt-3 mr-2">
        <span className="text-[10px] font-black text-secondary uppercase tracking-widest flex items-center gap-1">
          <Zap size={10} /> הצעות מהירות:
        </span>
        <button onClick={() => setInput("פגישת מנהלים בחדר הכי גדול מחר ב-10")} className="text-[11px] text-secondary hover:text-brand transition-colors">"חדר גדול למחר ב-10"</button>
        <button onClick={() => setInput("חדר שקט לעבודה מרוכזת היום ב-16:00")} className="text-[11px] text-secondary hover:text-brand transition-colors">"חדר שקט להיום ב-16:00"</button>
      </div>
    </div>
  );
};

export default NaturalLanguageInput;
