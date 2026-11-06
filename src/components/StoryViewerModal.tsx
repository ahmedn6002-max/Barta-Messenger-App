import React, { useEffect, useState } from 'react';
import { Story, Language } from '../types';
import { X, ChevronLeft, ChevronRight, Send, Heart } from 'lucide-react';

interface StoryViewerModalProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
  onReply: (story: Story, replyText: string) => void;
  lang: Language;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories,
  initialIndex = 0,
  onClose,
  onReply,
  lang
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [replyInput, setReplyInput] = useState('');
  const [isPaused, setIsPaused] = useState(false);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (!currentStory || isPaused) return;

    setProgress(0);
    const interval = 50; // update every 50ms
    const totalTime = 5000; // 5 seconds
    const step = (interval / totalTime) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          // Go to next or close
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((c) => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, stories.length, onClose, currentStory]);

  if (!currentStory) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim()) return;
    onReply(currentStory, replyInput.trim());
    setReplyInput('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="relative w-full max-w-sm h-[80vh] max-h-[640px] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-800">
        
        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex gap-1.5">
          {stories.map((s, idx) => (
            <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-75"
                style={{
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* User Info Header */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-white drop-shadow-md">
          <div className="flex items-center gap-2.5">
            <img 
              src={currentStory.userAvatar} 
              alt={currentStory.userName} 
              className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500"
            />
            <div>
              <p className="text-sm font-semibold">{currentStory.userName}</p>
              <p className="text-[10px] text-white/80">
                {lang === 'bn' ? 'স্ট্যাটাস আপডেট' : 'Status Update'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation buttons */}
        {currentIndex > 0 && (
          <button 
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <button 
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Story Content */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-slate-900">
          {currentStory.imageUrl ? (
            <img 
              src={currentStory.imageUrl} 
              alt="Story" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="p-8 text-center text-white text-lg font-medium">
              {currentStory.text}
            </div>
          )}

          {/* Caption banner if image + text */}
          {currentStory.imageUrl && currentStory.text && (
            <div className="absolute bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white text-center text-sm font-medium">
              {currentStory.text}
            </div>
          )}
        </div>

        {/* Story reply bar */}
        <form 
          onSubmit={handleSendReply}
          className="relative z-30 p-3 bg-black/70 border-t border-white/10 flex items-center gap-2"
        >
          <input
            type="text"
            value={replyInput}
            onChange={(e) => setReplyInput(e.target.value)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
            placeholder={lang === 'bn' ? 'উত্তর লিখুন...' : 'Reply to story...'}
            className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-white/50 focus:outline-hidden focus:border-emerald-400"
          />
          <button
            type="button"
            onClick={() => {
              onReply(currentStory, '❤️');
              onClose();
            }}
            className="p-2 text-rose-400 hover:text-rose-300 transition-colors"
          >
            <Heart className="w-5 h-5 fill-current" />
          </button>
          <button
            type="submit"
            disabled={!replyInput.trim()}
            className="p-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
