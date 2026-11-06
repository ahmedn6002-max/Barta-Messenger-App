import React, { useState } from 'react';
import { User, Language, Chat } from '../types';
import { X, Users, MessageSquare, Plus, Check } from 'lucide-react';

interface NewChatModalProps {
  currentUser: User;
  allUsers: User[];
  existingChats: Chat[];
  onCreateDirectChat: (targetUser: User) => void;
  onCreateGroupChat: (name: string, participantIds: string[], description?: string, avatar?: string) => void;
  onAddNewUser: (newUser: User) => void;
  onClose: () => void;
  lang: Language;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  currentUser,
  allUsers,
  onCreateDirectChat,
  onCreateGroupChat,
  onAddNewUser,
  onClose,
  lang
}) => {
  const [tab, setTab] = useState<'direct' | 'group' | 'new-contact'>('direct');

  // Group chat form states
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [groupAvatar, setGroupAvatar] = useState(
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&h=200&q=80'
  );

  // New Contact form states
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactBio, setContactBio] = useState('');

  const otherUsers = allUsers.filter(u => u.id !== currentUser.id);

  const toggleSelectParticipant = (userId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedParticipants.length === 0) return;
    onCreateGroupChat(groupName.trim(), [...selectedParticipants, currentUser.id], groupDesc.trim(), groupAvatar);
    onClose();
  };

  const handleAddNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) return;

    const sampleAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80'
    ];
    const randomAvatar = sampleAvatars[Math.floor(Math.random() * sampleAvatars.length)];

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: contactName.trim(),
      bengaliName: contactName.trim(),
      avatar: randomAvatar,
      status: 'online',
      bio: contactBio.trim() || 'বার্তা অ্যাপে যুক্ত হলাম 🚀',
      phone: contactPhone.trim() || '+৮৮০ ১৭০০-০০০০০০'
    };

    onAddNewUser(newUser);
    onCreateDirectChat(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4">
          {lang === 'bn' ? 'নতুন বার্তা শুরু করুন' : 'Start a New Conversation'}
        </h2>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-800/80 rounded-xl mb-5 border border-slate-700/60">
          <button
            onClick={() => setTab('direct')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              tab === 'direct'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {lang === 'bn' ? 'সরাসরি চ্যাট' : 'Direct Chat'}
          </button>
          <button
            onClick={() => setTab('group')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              tab === 'group'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            {lang === 'bn' ? 'নতুন গ্রুপ' : 'New Group'}
          </button>
          <button
            onClick={() => setTab('new-contact')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              tab === 'new-contact'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            {lang === 'bn' ? 'নতুন কন্টাক্ট' : 'Add Contact'}
          </button>
        </div>

        {/* Tab 1: Direct Chat with Contacts */}
        {tab === 'direct' && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <p className="text-xs text-slate-400 mb-2">
              {lang === 'bn' ? 'কাকে বার্তা পাঠাতে চান নির্বাচন করুন:' : 'Select who to message:'}
            </p>
            {otherUsers.map(u => (
              <button
                key={u.id}
                onClick={() => {
                  onCreateDirectChat(u);
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 text-left transition-all hover:scale-[1.01]"
              >
                <div className="relative">
                  <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                  {u.status === 'online' && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.name}</p>
                  <p className="text-xs text-slate-400 truncate">{u.bio}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Tab 2: Create Group */}
        {tab === 'group' && (
          <form onSubmit={handleCreateGroup} className="flex-1 flex flex-col overflow-y-auto space-y-3.5 pr-1">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'bn' ? 'গ্রুপের নাম' : 'Group Name'} *
              </label>
              <input
                type="text"
                required
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: কলেজের বন্ধুমহল 🚀' : 'e.g. Project Alpha'}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'bn' ? 'গ্রুপের বর্ণনা (ঐচ্ছিক)' : 'Description (Optional)'}
              </label>
              <input
                type="text"
                value={groupDesc}
                onChange={e => setGroupDesc(e.target.value)}
                placeholder={lang === 'bn' ? 'এই গ্রুপের উদ্দেশ্য...' : 'What is this group about?'}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'bn' ? 'সদস্য যোগ করুন' : 'Add Members'} ({selectedParticipants.length})
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto bg-slate-950/40 p-2 rounded-xl border border-slate-800">
                {otherUsers.map(u => {
                  const isChecked = selectedParticipants.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleSelectParticipant(u.id)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        isChecked ? 'bg-emerald-600/20 text-white' : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        isChecked ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-600'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                      <span className="text-xs font-medium truncate">{u.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={!groupName.trim() || selectedParticipants.length === 0}
              className="mt-3 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all disabled:opacity-40"
            >
              {lang === 'bn' ? 'গ্রুপ তৈরি করুন' : 'Create Group'}
            </button>
          </form>
        )}

        {/* Tab 3: Add Custom Contact */}
        {tab === 'new-contact' && (
          <form onSubmit={handleAddNewContact} className="flex-1 flex flex-col overflow-y-auto space-y-3.5 pr-1">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'bn' ? 'নাম' : 'Name'} *
              </label>
              <input
                type="text"
                required
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: ফারহান আহমেদ' : 'e.g. Alex Johnson'}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="+৮৮০ ১৭..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'bn' ? 'বায়ো / পদবি' : 'Bio / Status'}
              </label>
              <input
                type="text"
                value={contactBio}
                onChange={e => setContactBio(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: সফটওয়্যার ইঞ্জিনিয়ার' : 'e.g. Software Engineer'}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={!contactName.trim()}
              className="mt-3 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all disabled:opacity-40"
            >
              {lang === 'bn' ? 'কন্টাক্ট সেভ করে চ্যাট শুরু করুন' : 'Save & Chat'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
