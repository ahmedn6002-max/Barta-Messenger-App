import React from 'react';
import { Chat, User, Language, Message } from '../types';
import { X, Users, Image as ImageIcon, Bell, BellOff, Phone, FileText } from 'lucide-react';

interface ChatInfoDrawerProps {
  chat: Chat;
  allUsers: User[];
  messages: Message[];
  onClose: () => void;
  lang: Language;
}

export const ChatInfoDrawer: React.FC<ChatInfoDrawerProps> = ({
  chat,
  allUsers,
  messages,
  onClose,
  lang
}) => {
  const [isMuted, setIsMuted] = React.useState(false);

  // Find participants
  const participants = allUsers.filter(u => chat.participants.includes(u.id));

  // Collect images from messages
  const mediaAttachments = messages
    .flatMap(m => m.attachments || [])
    .filter(a => a.type === 'image');

  return (
    <div className="w-80 h-full border-l border-slate-800 bg-slate-900/95 flex flex-col text-slate-100 z-30 shrink-0 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-semibold text-sm">
          {chat.type === 'group' 
            ? (lang === 'bn' ? 'গ্রুপের বিবরণ' : 'Group Details')
            : (lang === 'bn' ? 'ব্যবহারকারীর বিবরণ' : 'Contact Details')}
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center">
          <img
            src={chat.avatar}
            alt={chat.name}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500/30 mb-3 shadow-xl"
          />
          <h4 className="font-bold text-lg text-white">{chat.name}</h4>
          {chat.type === 'group' ? (
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
              <Users className="w-3.5 h-3.5" />
              <span>{participants.length} {lang === 'bn' ? 'জন সদস্য' : 'members'}</span>
            </p>
          ) : (
            <p className="text-xs text-emerald-400 font-medium mt-1">
              {lang === 'bn' ? 'সক্রিয় আছেন' : 'Online'}
            </p>
          )}

          {chat.groupDescription && (
            <p className="text-xs text-slate-400 mt-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
              {chat.groupDescription}
            </p>
          )}
        </div>

        {/* Quick Settings */}
        <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-3 space-y-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {isMuted ? <BellOff className="w-4 h-4 text-rose-400" /> : <Bell className="w-4 h-4 text-emerald-400" />}
              <span>{lang === 'bn' ? 'নোটিফিকেশন মিউট' : 'Mute Notifications'}</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${isMuted ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-400'}`}>
              {isMuted ? (lang === 'bn' ? 'বন্ধ' : 'On') : (lang === 'bn' ? 'চালু' : 'Off')}
            </span>
          </button>
        </div>

        {/* Group Participants */}
        {chat.type === 'group' && (
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>{lang === 'bn' ? 'গ্রুপের সদস্যবৃন্দ' : 'Participants'}</span>
              <span className="text-[11px] font-normal text-slate-500">{participants.length}</span>
            </h5>
            <div className="space-y-2">
              {participants.map((u, i) => (
                <div key={u.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/30 border border-slate-800">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{u.bio}</p>
                    </div>
                  </div>
                  {i === 0 && (
                    <span className="text-[9px] font-semibold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/40">
                      {lang === 'bn' ? 'এডমিন' : 'Admin'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Media Gallery */}
        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'bn' ? 'শেয়ার করা ছবি ও ফাইল' : 'Shared Media'}</span>
            <span className="text-[11px] font-normal text-slate-500">({mediaAttachments.length})</span>
          </h5>
          {mediaAttachments.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {mediaAttachments.map((att) => (
                <a
                  key={att.id}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="aspect-square rounded-xl overflow-hidden border border-slate-700/60 hover:opacity-85 transition-opacity"
                >
                  <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 text-center text-xs text-slate-500">
              {lang === 'bn' ? 'এখনো কোনো ছবি শেয়ার করা হয়নি' : 'No shared media yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
