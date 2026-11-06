import React, { useState } from 'react';
import { Chat, User, Story, Language, ThemeMode } from '../types';
import { formatTime } from '../utils/helpers';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  Users, 
  Pin, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  Languages, 
  UserCheck,
  CheckCheck,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  currentUser: User;
  stories: Story[];
  onOpenStory: (index: number) => void;
  onOpenNewChatModal: () => void;
  onOpenProfileModal: () => void;
  lang: Language;
  onToggleLang: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  currentUser,
  stories,
  onOpenStory,
  onOpenNewChatModal,
  onOpenProfileModal,
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'direct' | 'group'>('all');

  // Filter chats
  const filteredChats = chats
    .filter(c => {
      // Search
      const matchesSearch = 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.lastMessage?.text.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      if (!matchesSearch) return false;

      // Filter tabs
      if (filterTab === 'unread') return c.unreadCount > 0;
      if (filterTab === 'direct') return c.type === 'direct';
      if (filterTab === 'group') return c.type === 'group';
      return true;
    })
    .sort((a, b) => {
      // Pinned first, then by last message timestamp
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = a.lastMessage?.timestamp || 0;
      const timeB = b.lastMessage?.timestamp || 0;
      return timeB - timeA;
    });

  return (
    <div className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-slate-900 border-r border-slate-800 text-slate-100 shrink-0 select-none">
      
      {/* 1. Header with App Title & Quick Settings */}
      <div className="p-3.5 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base tracking-tight text-white">বার্তা</h1>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Barta
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {lang === 'bn' ? 'রিয়েল-টাইম মেসেঞ্জার' : 'Real-time Messenger'}
              </p>
            </div>
          </div>

          {/* Quick Action Icons */}
          <div className="flex items-center gap-1">
            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors ${
                !soundEnabled ? 'text-rose-400' : ''
              }`}
              title={soundEnabled ? 'Sound On' : 'Sound Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={onToggleLang}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-0.5 text-xs font-semibold"
              title="Change Language"
            >
              <Languages className="w-4 h-4" />
              <span>{lang === 'bn' ? 'বাং' : 'EN'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* New Chat Button */}
            <button
              onClick={onOpenNewChatModal}
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30"
              title={lang === 'bn' ? 'নতুন বার্তা' : 'New Chat'}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Active User Profile Banner (Clickable to switch identity) */}
        <div 
          onClick={onOpenProfileModal}
          className="flex items-center justify-between p-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-all hover:scale-[1.01]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                <span className="text-[10px] text-emerald-400 font-normal">
                  ({lang === 'bn' ? 'সক্রিয়' : 'You'})
                </span>
              </p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser.bio}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'স্যুইচ' : 'Switch'}</span>
          </div>
        </div>
      </div>

      {/* 2. Stories / Status Updates Bar */}
      <div className="p-3 border-b border-slate-800 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-3">
          {/* My Status */}
          <div 
            onClick={() => onOpenStory(0)}
            className="flex flex-col items-center gap-1 cursor-pointer shrink-0 group"
          >
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-700 group-hover:ring-emerald-500 transition-all"
              />
              <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-slate-900">
                <Plus className="w-3 h-3 stroke-[3]" />
              </div>
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-white transition-colors truncate w-14 text-center">
              {lang === 'bn' ? 'আমার স্ট্যাটাস' : 'My Status'}
            </span>
          </div>

          {/* Contact stories */}
          {stories.map((story, idx) => (
            <div
              key={story.id}
              onClick={() => onOpenStory(idx)}
              className="flex flex-col items-center gap-1 cursor-pointer shrink-0 group"
            >
              <div className="p-0.5 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 group-hover:scale-105 transition-transform">
                <img
                  src={story.userAvatar}
                  alt={story.userName}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-900"
                />
              </div>
              <span className="text-[10px] text-slate-300 group-hover:text-white transition-colors truncate w-14 text-center">
                {story.userName.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'bn' ? 'বার্তা বা নাম খুঁজুন...' : 'Search chats...'}
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* 4. Filter Pills */}
      <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: lang === 'bn' ? 'সকল' : 'All' },
          { id: 'unread', label: lang === 'bn' ? 'অপঠিত' : 'Unread' },
          { id: 'direct', label: lang === 'bn' ? 'ব্যক্তিগত' : 'Direct' },
          { id: 'group', label: lang === 'bn' ? 'গ্রুপ' : 'Groups' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id as typeof filterTab)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
              filterTab === tab.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 5. Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        {filteredChats.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            {lang === 'bn' ? 'কোনো চ্যাট পাওয়া যায়নি' : 'No chats found'}
          </div>
        ) : (
          filteredChats.map(chat => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`p-3 flex items-center gap-3 cursor-pointer transition-all ${
                  isActive 
                    ? 'bg-emerald-600/15 border-l-4 border-emerald-500' 
                    : 'hover:bg-slate-800/60'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover ring-1 ring-slate-700"
                  />
                  {chat.type === 'direct' && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
                  )}
                  {chat.type === 'group' && (
                    <div className="absolute -bottom-1 -right-1 p-1 bg-slate-800 rounded-full text-slate-300 border border-slate-700">
                      <Users className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                {/* Info & Last message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                      <span>{chat.name}</span>
                      {chat.isPinned && <Pin className="w-3 h-3 text-amber-400 fill-current" />}
                    </h3>
                    {chat.lastMessage && (
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                        {formatTime(chat.lastMessage.timestamp, lang)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="truncate pr-2">
                      {chat.typingUsers && chat.typingUsers.length > 0 ? (
                        <span className="text-emerald-400 font-medium">
                          {lang === 'bn' ? 'টাইপ করছে...' : 'typing...'}
                        </span>
                      ) : (
                        <span>{chat.lastMessage?.text || (lang === 'bn' ? 'বার্তা পাঠান' : 'Start chatting')}</span>
                      )}
                    </div>

                    {/* Unread badge */}
                    {chat.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[10px] shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
