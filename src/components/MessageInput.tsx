import React, { useState, useRef, useEffect } from 'react';
import { Attachment, Language, Message } from '../types';
import { 
  Smile, 
  Paperclip, 
  Mic, 
  Send, 
  X, 
  Image as ImageIcon, 
  Trash2, 
  Square,
  Sparkles
} from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string, attachments?: Attachment[], replyTo?: Message) => void;
  replyingTo: Message | null;
  onCancelReply: () => void;
  onTyping?: (isTyping: boolean) => void;
  lang: Language;
}

const COMMON_EMOJIS = ['😊', '😂', '❤️', '👍', '🔥', '🎉', '🙌', '😍', '✨', '🙏', '👏', '🤝', '☕️', '🚀', '💯', '🤩'];

const BENGALI_QUICK_PHRASES = [
  'আসসালামু আলাইকুম',
  'কেমন আছেন?',
  'আলহামদুলিল্লাহ ভালো',
  'ধন্যবাদ ভাই!',
  'ঠিক আছে, কথা হবে',
  'চলুন মিটিং শুরু করি'
];

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  replyingTo,
  onCancelReply,
  onTyping,
  lang
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [selectedAttachments, setSelectedAttachments] = useState<Attachment[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recordTimerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Typing throttle
  const typingTimeoutRef = useRef<number | null>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = window.setTimeout(() => {
        onTyping(false);
      }, 1500);
    }
  };

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && selectedAttachments.length === 0) return;

    onSendMessage(
      trimmed, 
      selectedAttachments.length > 0 ? selectedAttachments : undefined,
      replyingTo || undefined
    );

    setText('');
    setSelectedAttachments([]);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
    onCancelReply();
    if (onTyping) onTyping(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // File Upload Handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const newAtt: Attachment = {
        id: `att-${Date.now()}`,
        type: isImg ? 'image' : 'file',
        url: result,
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`
      };
      setSelectedAttachments(prev => [...prev, newAtt]);
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Add sample photos
  const handleAddSampleImage = (url: string, name: string) => {
    setSelectedAttachments(prev => [
      ...prev,
      {
        id: `att-${Date.now()}`,
        type: 'image',
        url,
        name
      }
    ]);
    setShowAttachMenu(false);
  };

  // Voice Note Recording
  const startRecording = async () => {
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.start();
      }
    } catch {
      // Permission denied or audio unavailable; will record simulated audio duration
    }

    setIsRecording(true);
    setRecordingSeconds(0);
    recordTimerRef.current = window.setInterval(() => {
      setRecordingSeconds(sec => sec + 1);
    }, 1000);
  };

  const stopAndSendRecording = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    const duration = recordingSeconds || 3;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        sendVoiceMessage(audioUrl, duration);
      };
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    } else {
      // Mock audio track
      sendVoiceMessage('simulated_audio', duration);
    }

    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const cancelRecording = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const sendVoiceMessage = (url: string, durationSecs: number) => {
    const audioAtt: Attachment = {
      id: `voice-${Date.now()}`,
      type: 'audio',
      url,
      name: `Voice_Note_${durationSecs}s.m4a`,
      duration: durationSecs
    };
    onSendMessage(lang === 'bn' ? '🎙️ অডিও বার্তা' : '🎙️ Voice message', [audioAtt], replyingTo || undefined);
    onCancelReply();
  };

  const formatRecSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative border-t border-slate-800 bg-slate-900/90 backdrop-blur-md p-3">
      {/* Reply Quote Banner */}
      {replyingTo && (
        <div className="mb-2 p-2.5 rounded-xl bg-slate-800/90 border-l-4 border-emerald-500 flex items-center justify-between text-xs text-slate-300">
          <div className="min-w-0 pr-2">
            <span className="font-semibold text-emerald-400 block truncate">
              {replyingTo.senderName}
            </span>
            <p className="truncate text-slate-400">{replyingTo.text || 'ফাইল / ছবি'}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 hover:text-white text-slate-400 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachments preview list */}
      {selectedAttachments.length > 0 && (
        <div className="mb-2 flex items-center gap-2 overflow-x-auto pb-1">
          {selectedAttachments.map(att => (
            <div key={att.id} className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-800 shrink-0">
              {att.type === 'image' ? (
                <img src={att.url} alt={att.name} className="w-16 h-16 object-cover" />
              ) : (
                <div className="w-16 h-16 flex flex-col items-center justify-center p-1 text-center">
                  <span className="text-[10px] text-slate-400 truncate w-14">{att.name}</span>
                </div>
              )}
              <button
                onClick={() => setSelectedAttachments(prev => prev.filter(a => a.id !== att.id))}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Row */}
      <div className="flex items-end gap-2">
        {isRecording ? (
          // Recording in progress mode
          <div className="flex-1 flex items-center justify-between bg-slate-800/80 border border-rose-500/40 rounded-2xl px-4 py-2.5 text-white animate-pulse">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-mono font-bold text-rose-400">
                {formatRecSeconds(recordingSeconds)}
              </span>
              <span className="text-xs text-slate-400">
                {lang === 'bn' ? 'ভয়েস রেকর্ড হচ্ছে...' : 'Recording voice note...'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelRecording}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700 transition-colors"
                title={lang === 'bn' ? 'বাতিল করুন' : 'Cancel'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={stopAndSendRecording}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>{lang === 'bn' ? 'পাঠান' : 'Send'}</span>
              </button>
            </div>
          </div>
        ) : (
          // Normal Typing Mode
          <>
            {/* Attachment Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(!showAttachMenu);
                  setShowEmojiPicker(false);
                }}
                className={`p-2.5 rounded-xl transition-colors ${
                  showAttachMenu 
                    ? 'bg-slate-800 text-emerald-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={lang === 'bn' ? 'ফাইল বা ছবি যুক্ত করুন' : 'Attach File'}
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Attachment Popover */}
              {showAttachMenu && (
                <div className="absolute bottom-12 left-0 z-40 bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-2xl w-64 text-slate-200">
                  <p className="text-xs font-semibold text-slate-400 mb-2">
                    {lang === 'bn' ? 'সংযুক্ত করুন' : 'Attachments'}
                  </p>
                  
                  {/* Real file upload trigger */}
                  <label className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800 cursor-pointer text-xs font-medium transition-colors">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <span>{lang === 'bn' ? 'ডিভাইস থেকে ছবি/ফাইল' : 'From Device'}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Sample photos */}
                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <p className="text-[11px] text-slate-400 mb-2">
                      {lang === 'bn' ? 'নমুনা ছবি বেছে নিন:' : 'Sample Photos:'}
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80', name: 'beach.jpg' },
                        { url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80', name: 'coding.jpg' },
                        { url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80', name: 'tea.jpg' }
                      ].map((item, idx) => (
                        <img
                          key={idx}
                          src={item.url}
                          alt={item.name}
                          onClick={() => handleAddSampleImage(item.url, item.name)}
                          className="h-12 w-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-slate-700"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Emoji Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowAttachMenu(false);
                }}
                className={`p-2.5 rounded-xl transition-colors ${
                  showEmojiPicker 
                    ? 'bg-slate-800 text-yellow-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={lang === 'bn' ? 'ইমোজি ও দ্রুত বার্তা' : 'Emojis'}
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Emoji & Quick Phrases Popover */}
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-40 bg-slate-900 border border-slate-700 rounded-2xl p-3.5 shadow-2xl w-72 text-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">
                      {lang === 'bn' ? 'ইমোজি' : 'Emojis'}
                    </span>
                    <button 
                      onClick={() => setShowEmojiPicker(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-8 gap-1.5 mb-3">
                    {COMMON_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setText(prev => prev + emoji)}
                        className="text-xl p-1 hover:bg-slate-800 rounded-lg transition-transform hover:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-2">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      {lang === 'bn' ? 'দ্রুত বার্তা (Quick Phrases)' : 'Quick Phrases'}
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {BENGALI_QUICK_PHRASES.map(phrase => (
                        <button
                          key={phrase}
                          type="button"
                          onClick={() => {
                            setText(phrase);
                            setShowEmojiPicker(false);
                          }}
                          className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-emerald-600/30 hover:border-emerald-500/50 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
                        >
                          {phrase}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Textarea */}
            <div className="flex-1 bg-slate-800/90 border border-slate-700/80 rounded-2xl px-3.5 py-2 focus-within:border-emerald-500 transition-colors">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={lang === 'bn' ? 'বার্তা লিখুন... (Enter চাপুন)' : 'Type a message... (Press Enter)'}
                className="w-full bg-transparent resize-none text-sm text-white placeholder-slate-400 focus:outline-hidden leading-relaxed max-h-28 overflow-y-auto"
              />
            </div>

            {/* Voice Record Button (when input empty) or Send Button */}
            {text.trim() || selectedAttachments.length > 0 ? (
              <button
                type="button"
                onClick={handleSend}
                className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 shrink-0"
                title={lang === 'bn' ? 'পাঠান' : 'Send'}
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/40 transition-all shrink-0"
                title={lang === 'bn' ? 'ভয়েস রেকর্ড করুন' : 'Record Voice Note'}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
