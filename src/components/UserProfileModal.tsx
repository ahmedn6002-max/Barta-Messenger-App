import React from 'react';
import { User, Language } from '../types';
import { Check, UserCheck, X } from 'lucide-react';

interface UserProfileModalProps {
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  onUpdateCurrentUser: (updated: User) => void;
  onClose: () => void;
  lang: Language;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  onClose,
  lang
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {lang === 'bn' ? 'ব্যবহারকারী নির্বাচন করুন' : 'Switch Active Profile'}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'bn' 
                ? 'বার্তা পাঠানোর জন্য প্রোফাইল পরিবর্তন করুন' 
                : 'Switch who you are chatting as'}
            </p>
          </div>
        </div>

        {/* Current profile card */}
        <div className="bg-slate-800/80 border border-emerald-500/30 rounded-xl p-4 mb-5 flex items-center gap-3.5">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white truncate">{currentUser.name}</span>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/40">
                {lang === 'bn' ? 'বর্তমান' : 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">{currentUser.bio}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{currentUser.phone}</p>
          </div>
        </div>

        {/* Switch identity list */}
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
          {lang === 'bn' ? 'অন্য প্রোফাইলে স্যুইচ করুন' : 'Available Profiles'}
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {allUsers.map((user) => {
            const isSelected = user.id === currentUser.id;
            return (
              <button
                key={user.id}
                onClick={() => {
                  onSelectUser(user);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  isSelected 
                    ? 'bg-emerald-600/20 border border-emerald-500/50 text-white' 
                    : 'bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 text-slate-300 hover:text-white'
                }`}
              >
                <div className="relative">
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {user.status === 'online' && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user.bio}</p>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-5 p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-xs text-slate-400 flex items-center gap-2">
          <span>💡</span>
          <span>
            {lang === 'bn' 
              ? 'টিপস: দুইজনের মধ্যে লাইভ চ্যাট দেখতে প্রোফাইল দ্রুত পরিবর্তন করতে পারেন!'
              : 'Tip: Switch profiles to chat back-and-forth between characters!'}
          </span>
        </div>
      </div>
    </div>
  );
};
