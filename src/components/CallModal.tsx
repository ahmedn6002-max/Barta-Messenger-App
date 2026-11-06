import React, { useEffect, useState, useRef } from 'react';
import { soundManager } from '../utils/sound';
import { Language } from '../types';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';

interface CallModalProps {
  contactName: string;
  contactAvatar: string;
  callType: 'audio' | 'video';
  onClose: () => void;
  lang: Language;
}

export const CallModal: React.FC<CallModalProps> = ({
  contactName,
  contactAvatar,
  callType,
  onClose,
  lang
}) => {
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Start ringtone and simulate connection
  useEffect(() => {
    soundManager.startRingtone();

    // Auto-answer after 3.2 seconds
    const timer = setTimeout(() => {
      soundManager.stopRingtone();
      setCallStatus('connected');
    }, 3200);

    return () => {
      clearTimeout(timer);
      soundManager.stopRingtone();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Duration timer when connected
  useEffect(() => {
    if (callStatus !== 'connected') return;

    const interval = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callStatus]);

  // Handle local camera preview for video call if available
  useEffect(() => {
    if (callType === 'video' && isVideoEnabled && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          localStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // Camera permission denied or not available, use avatar fallback
        });
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    }
  }, [callType, isVideoEnabled]);

  const handleEndCall = () => {
    soundManager.stopRingtone();
    soundManager.playHangup();
    setCallStatus('ended');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const formatCallDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(mins)}:${pad(remainingSecs)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm h-[580px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-between p-6">
        
        {/* Background ambient lighting */}
        <div className="absolute inset-0 bg-radial from-emerald-900/30 via-slate-900/60 to-slate-950 pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 text-center mt-4">
          <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-medium mb-3">
            {callType === 'video' 
              ? (lang === 'bn' ? 'ভিডিও কল' : 'Video Call') 
              : (lang === 'bn' ? 'অডিও কল' : 'Voice Call')}
          </span>
          <h3 className="text-xl font-bold text-white mb-1">{contactName}</h3>
          <p className="text-xs text-slate-400 font-mono">
            {callStatus === 'ringing' 
              ? (lang === 'bn' ? 'রিং হচ্ছে...' : 'Ringing...') 
              : callStatus === 'connected' 
              ? formatCallDuration(duration) 
              : (lang === 'bn' ? 'কল সমাপ্ত' : 'Call Ended')}
          </p>
        </div>

        {/* Middle: Video or Avatar */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center w-full">
          {callType === 'video' && isVideoEnabled ? (
            <div className="relative w-48 h-64 rounded-2xl overflow-hidden ring-2 ring-emerald-500/50 shadow-2xl bg-black">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              {/* Remote simulation overlay */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-xs">
                <img src={contactAvatar} alt={contactName} className="w-6 h-6 rounded-full object-cover" />
                <span className="text-[11px] text-white truncate">{contactName}</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              {callStatus === 'ringing' && (
                <div className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-ping" />
              )}
              <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-emerald-500/50 shadow-2xl">
                <img 
                  src={contactAvatar} 
                  alt={contactName} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Call Controls */}
        <div className="relative z-10 w-full flex items-center justify-around bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md">
          {/* Mute toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-full transition-all ${
              isMuted 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video toggle (if video call) */}
          {callType === 'video' && (
            <button
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              className={`p-3.5 rounded-full transition-all ${
                !isVideoEnabled 
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Camera"
            >
              {!isVideoEnabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* Speaker toggle */}
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`p-3.5 rounded-full transition-all ${
              !isSpeakerOn 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="Speaker"
          >
            {!isSpeakerOn ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
            title={lang === 'bn' ? 'কল কাটুন' : 'End Call'}
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
