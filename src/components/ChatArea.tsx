import React, { useState, useRef, useEffect } from 'react';
import { Chat, Message, User, Language, Attachment } from '../types';
import { formatTime, formatMessageDate } from '../utils/helpers';
import { soundManager } from '../utils/sound';
import { MessageInput } from './MessageInput';
import { 
  Phone, 
  Video, 
  Search, 
  Info, 
  ArrowLeft, 
  Pin, 
  PinOff,
  CornerUpLeft, 
  Trash2, 
  Copy, 
  Check, 
  CheckCheck, 
  Play, 
  Pause, 
  Bot,
  ChevronDown,
  X,
  SmilePlus
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChatAreaProps {
  chat: Chat;
  currentUser: User;
  allUsers: User[];
  messages: Message[];
  onSendMessage: (text: string, attachments?: Attachment[], replyTo?: Message) => void;
  onReactMessage: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onTogglePinMessage: (messageId: string) => void;
  onStartCall: (type: 'audio' | 'video') => void;
  onToggleInfoDrawer: () => void;
  onBackToSidebar: () => void;
  isAutoReplyEnabled: boolean;
  onToggleAutoReply: () => void;
  onSimulateReplyNow: () => void;
  lang: Language;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  currentUser,
  allUsers,
  messages,
  onSendMessage,
  onReactMessage,
  onDeleteMessage,
  onTogglePinMessage,
  onStartCall,
  onToggleInfoDrawer,
  onBackToSidebar,
  isAutoReplyEnabled,
  onToggleAutoReply,
  onSimulateReplyNow,
  lang
}) => {
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isUp);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Find pinned message if any
  const pinnedMessage = messages.find(m => m.isPinned && !m.isDeleted);

  // Filter messages by search query if search is active
  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  // Audio Playback simulation
  const togglePlayAudio = (attId: string) => {
    if (activeAudioId === attId) {
      setActiveAudioId(null);
    } else {
      setActiveAudioId(attId);
      soundManager.playReaction();
      // Auto stop after 5s
      setTimeout(() => {
        setActiveAudioId(current => current === attId ? null : current);
      }, 5000);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const triggerReactionWithEffects = (msgId: string, emoji: string) => {
    soundManager.playReaction();
    onReactMessage(msgId, emoji);
    if (emoji === '🔥' || emoji === '🎉' || emoji === '❤️') {
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.8 }
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden text-slate-100">
      
      {/* 1. Chat Top Header */}
      <div className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          <button
            onClick={onBackToSidebar}
            className="md:hidden p-2 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Contact / Group Avatar */}
          <div className="relative shrink-0">
            <img
              src={chat.avatar}
              alt={chat.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/40"
            />
            {chat.type === 'direct' && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
            )}
          </div>

          {/* Contact Details */}
          <div className="min-w-0">
            <h2 className="font-bold text-sm text-white truncate flex items-center gap-2">
              <span>{chat.name}</span>
            </h2>
            <p className="text-xs text-slate-400 truncate">
              {chat.typingUsers && chat.typingUsers.length > 0 ? (
                <span className="text-emerald-400 font-medium animate-pulse">
                  {lang === 'bn' ? 'টাইপ করছে...' : 'typing...'}
                </span>
              ) : chat.type === 'group' ? (
                <span>{chat.participants.length} {lang === 'bn' ? 'জন সদস্য' : 'members'}</span>
              ) : (
                <span className="text-emerald-400">
                  {lang === 'bn' ? 'অনলাইন' : 'online'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Auto-reply quick toggle button */}
          <button
            onClick={onToggleAutoReply}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              isAutoReplyEnabled
                ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
            }`}
            title={lang === 'bn' ? 'অটো-রিপ্লাই সিমুলেটর চালু/বন্ধ করুন' : 'Toggle Auto-Reply'}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'অটো-রিপ্লাই' : 'Auto Reply'}</span>
            <span className={`w-2 h-2 rounded-full ${isAutoReplyEnabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          </button>

          {/* Instant reply trigger button */}
          <button
            onClick={onSimulateReplyNow}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title={lang === 'bn' ? 'এখনই একটি রিপ্লাই সিমুলেট করুন' : 'Simulate reply from contact'}
          >
            <span>💬</span>
            <span className="hidden md:inline">{lang === 'bn' ? 'রিপ্লাই আনুন' : 'Get Reply'}</span>
          </button>

          {/* Audio Call */}
          <button
            onClick={() => onStartCall('audio')}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title={lang === 'bn' ? 'অডিও কল' : 'Voice Call'}
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Video Call */}
          <button
            onClick={() => onStartCall('video')}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title={lang === 'bn' ? 'ভিডিও কল' : 'Video Call'}
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Search Toggle */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded-xl transition-colors ${
              isSearchOpen ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title={lang === 'bn' ? 'মেসেজ খুঁজুন' : 'Search in chat'}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Info Drawer */}
          <button
            onClick={onToggleInfoDrawer}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title={lang === 'bn' ? 'বিস্তারিত তথ্য' : 'Chat Info'}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Pinned Message Bar */}
      {pinnedMessage && (
        <div className="bg-slate-900/90 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-xs z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <Pin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-emerald-400 mr-2">
                {lang === 'bn' ? 'পিন করা বার্তা:' : 'Pinned:'}
              </span>
              <span className="text-slate-300">{pinnedMessage.text}</span>
            </div>
          </div>
          <button
            onClick={() => onTogglePinMessage(pinnedMessage.id)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            title={lang === 'bn' ? 'আনপিন করুন' : 'Unpin'}
          >
            <PinOff className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. In-Chat Search Bar */}
      {isSearchOpen && (
        <div className="bg-slate-900/95 border-b border-slate-800 p-2.5 px-4 flex items-center gap-2 z-10 animate-in slide-in-from-top-2 duration-150">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'bn' ? 'বার্তা দিয়ে খুঁজুন...' : 'Search in this chat...'}
            autoFocus
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 focus:outline-hidden"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button 
            onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-md"
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      )}

      {/* 4. Messages Container */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(16, 185, 129, 0.03) 0%, transparent 70%)`
        }}
      >
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-2xl">
              💬
            </div>
            <p className="text-sm font-medium text-slate-400">
              {lang === 'bn' ? 'এখনো কোনো বার্তা নেই' : 'No messages here yet'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              {lang === 'bn' 
                ? 'একটি বন্ধুত্বপূর্ণ শুভেচ্ছা পাঠান এবং কথা বলা শুরু করুন!'
                : 'Say hello and start the conversation!'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const isMe = msg.senderId === currentUser.id;
            const prevMsg = filteredMessages[index - 1];
            const isFirstOfGroup = !prevMsg || prevMsg.senderId !== msg.senderId;

            // Date separator check
            const showDateSeparator = !prevMsg || 
              new Date(prevMsg.timestamp).toDateString() !== new Date(msg.timestamp).toDateString();

            return (
              <React.Fragment key={msg.id}>
                {/* Date separator pill */}
                {showDateSeparator && (
                  <div className="flex justify-center my-3">
                    <span className="px-3 py-1 bg-slate-900/80 border border-slate-800 text-slate-400 rounded-full text-[11px] font-medium shadow-xs">
                      {formatMessageDate(msg.timestamp, lang)}
                    </span>
                  </div>
                )}

                {/* Message Bubble Row */}
                <div 
                  className={`flex items-end gap-2 group relative ${isMe ? 'justify-end' : 'justify-start'}`}
                  onMouseEnter={() => setHoveredMessageId(msg.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  {/* Other user avatar (in groups or first of group) */}
                  {!isMe && (
                    <div className="w-7 shrink-0">
                      {isFirstOfGroup ? (
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700"
                        />
                      ) : (
                        <div className="w-7 h-7" />
                      )}
                    </div>
                  )}

                  {/* Bubble & Hover Actions wrapper */}
                  <div className="relative max-w-[85%] sm:max-w-[70%]">
                    
                    {/* Hover Action Menu */}
                    {hoveredMessageId === msg.id && !msg.isDeleted && (
                      <div className={`absolute -top-9 z-20 flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl px-1.5 py-1 shadow-xl animate-in fade-in duration-100 ${
                        isMe ? 'right-0' : 'left-0'
                      }`}>
                        {/* Quick Reactions */}
                        {['❤️', '👍', '😂', '🔥'].map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => triggerReactionWithEffects(msg.id, emoji)}
                            className="p-1 text-sm hover:scale-125 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}

                        <div className="w-px h-3 bg-slate-700 mx-0.5" />

                        {/* Reply */}
                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                          title={lang === 'bn' ? 'উত্তর দিন' : 'Reply'}
                        >
                          <CornerUpLeft className="w-3.5 h-3.5" />
                        </button>

                        {/* Pin */}
                        <button
                          onClick={() => onTogglePinMessage(msg.id)}
                          className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                          title={msg.isPinned ? 'Unpin' : 'Pin'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>

                        {/* Copy */}
                        <button
                          onClick={() => handleCopyText(msg.text)}
                          className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                          title="Copy text"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteMessage(msg.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Bubble Content */}
                    <div className={`rounded-2xl px-3.5 py-2.5 shadow-md relative ${
                      isMe 
                        ? 'bg-emerald-600 text-white rounded-br-xs' 
                        : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/50'
                    }`}>
                      {/* Sender Name in group chats */}
                      {!isMe && chat.type === 'group' && isFirstOfGroup && (
                        <p className="text-[11px] font-semibold text-emerald-400 mb-1">
                          {msg.senderName}
                        </p>
                      )}

                      {/* Quoted Reply Snippet */}
                      {msg.replyTo && (
                        <div className={`mb-1.5 p-2 rounded-lg text-xs border-l-2 flex flex-col ${
                          isMe 
                            ? 'bg-emerald-700/60 border-white/60 text-white/90' 
                            : 'bg-slate-900/60 border-emerald-400 text-slate-300'
                        }`}>
                          <span className="font-semibold text-[10px] opacity-80">
                            {msg.replyTo.senderName}
                          </span>
                          <span className="truncate text-[11px]">
                            {msg.replyTo.text}
                          </span>
                        </div>
                      )}

                      {/* Attachments (Images, Audio, Files) */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="space-y-2 mb-1.5">
                          {msg.attachments.map(att => {
                            if (att.type === 'image') {
                              return (
                                <img
                                  key={att.id}
                                  src={att.url}
                                  alt={att.name}
                                  onClick={() => setPreviewImage(att.url)}
                                  className="rounded-xl max-h-60 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                />
                              );
                            }
                            if (att.type === 'audio') {
                              const isPlaying = activeAudioId === att.id;
                              return (
                                <div 
                                  key={att.id} 
                                  className={`flex items-center gap-3 p-2.5 rounded-xl ${
                                    isMe ? 'bg-emerald-700/50' : 'bg-slate-900/70'
                                  }`}
                                >
                                  <button
                                    onClick={() => togglePlayAudio(att.id)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                                      isMe ? 'bg-white text-emerald-600' : 'bg-emerald-500 text-white'
                                    }`}
                                  >
                                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                                  </button>
                                  
                                  {/* Waveform graphic */}
                                  <div className="flex-1 flex items-center gap-1 h-6">
                                    {[30, 60, 90, 45, 80, 25, 70, 95, 50, 65, 30, 85, 40].map((h, i) => (
                                      <div
                                        key={i}
                                        className={`w-1 rounded-full transition-all duration-200 ${
                                          isPlaying ? 'bg-emerald-300 animate-pulse' : isMe ? 'bg-white/60' : 'bg-slate-400'
                                        }`}
                                        style={{ height: `${h}%` }}
                                      />
                                    ))}
                                  </div>

                                  <span className="text-[11px] font-mono opacity-80">
                                    {att.duration ? `0:${att.duration.toString().padStart(2, '0')}` : '0:04'}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}

                      {/* Message Text */}
                      {msg.isDeleted ? (
                        <p className="text-xs italic opacity-60">
                          {lang === 'bn' ? '🚫 এই বার্তাটি মুছে ফেলা হয়েছে' : '🚫 This message was deleted'}
                        </p>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                          {msg.text}
                        </p>
                      )}

                      {/* Message Meta: Time & Read Status */}
                      <div className={`flex items-center justify-end gap-1 text-[10px] mt-1 select-none ${
                        isMe ? 'text-emerald-100/80' : 'text-slate-400'
                      }`}>
                        {msg.isPinned && <Pin className="w-3 h-3 text-amber-300 mr-0.5" />}
                        <span>{formatTime(msg.timestamp, lang)}</span>

                        {isMe && (
                          <span className="ml-0.5">
                            {msg.status === 'read' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-cyan-200" />
                            ) : msg.status === 'delivered' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-200/80" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-emerald-200/60" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reactions Pill Display */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {Object.entries(msg.reactions).map(([emoji, users]) => {
                          if (users.length === 0) return null;
                          const hasReacted = users.includes(currentUser.id);
                          return (
                            <button
                              key={emoji}
                              onClick={() => triggerReactionWithEffects(msg.id, emoji)}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] border shadow-xs transition-transform hover:scale-110 ${
                                hasReacted 
                                  ? 'bg-emerald-600/30 border-emerald-500/50 text-white' 
                                  : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span className="text-[10px] font-medium">{users.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}

        {/* Typing indicator at the bottom */}
        {chat.typingUsers && chat.typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-slate-900/60 px-3 py-1.5 rounded-full w-fit border border-slate-800">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
            </div>
            <span>
              {chat.name} {lang === 'bn' ? 'টাইপ করছে...' : 'is typing...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 z-20 p-2.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 shadow-xl hover:bg-slate-700 transition-all hover:scale-105"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* 5. Message Input Bar */}
      <MessageInput
        onSendMessage={onSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        lang={lang}
      />

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in"
        >
          <button 
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={previewImage} 
            alt="Enlarged" 
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
