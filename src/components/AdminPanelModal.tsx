import React, { useState } from 'react';
import { User, Chat, Language, Announcement } from '../types';
import { verifyAdminPassword, setAdminPassword } from '../utils/storage';
import { soundManager } from '../utils/sound';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  UserX, 
  UserCheck, 
  Trash2, 
  Bell, 
  Send, 
  Search, 
  Key, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  BarChart3, 
  LogOut,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  chats: Chat[];
  totalMessagesCount: number;
  onBlockUser: (userId: string) => void;
  onUnblockUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onBroadcastNotification: (announcement: Omit<Announcement, 'id' | 'timestamp'>, postToChats: boolean) => void;
  announcements: Announcement[];
  onDeleteAnnouncement: (announcementId: string) => void;
  lang: Language;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  chats,
  totalMessagesCount,
  onBlockUser,
  onUnblockUser,
  onDeleteUser,
  onBroadcastNotification,
  announcements,
  onDeleteAnnouncement,
  lang
}) => {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'broadcast' | 'security'>('dashboard');

  // User management tab states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Broadcast announcement states
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annType, setAnnType] = useState<'info' | 'warning' | 'alert' | 'celebration'>('info');
  const [postToChats, setPostToChats] = useState(true);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Security password change states
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passChangeStatus, setPassChangeStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(passwordInput)) {
      setIsAuthenticated(true);
      setAuthError('');
      soundManager.playReaction();
    } else {
      setAuthError(lang === 'bn' ? 'ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।' : 'Incorrect password! Please try again.');
      soundManager.playHangup();
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
    setActiveTab('dashboard');
  };

  // Broadcast submit handler
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;

    onBroadcastNotification(
      {
        title: annTitle.trim(),
        message: annMessage.trim(),
        type: annType,
        active: true
      },
      postToChats
    );

    soundManager.playReceived();
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.6 }
    });

    setAnnTitle('');
    setAnnMessage('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 3500);
  };

  // Change password handler
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyAdminPassword(currentPass)) {
      setPassChangeStatus({
        success: false,
        message: lang === 'bn' ? 'বর্তমান পাসওয়ার্ডটি সঠিক নয়।' : 'Current password is incorrect.'
      });
      return;
    }
    if (newPass.length < 4) {
      setPassChangeStatus({
        success: false,
        message: lang === 'bn' ? 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' : 'Password must be at least 4 characters.'
      });
      return;
    }
    if (newPass !== confirmPass) {
      setPassChangeStatus({
        success: false,
        message: lang === 'bn' ? 'নতুন পাসওয়ার্ড দুটি মিলছে না।' : 'New passwords do not match.'
      });
      return;
    }

    setAdminPassword(newPass);
    setPassChangeStatus({
      success: true,
      message: lang === 'bn' ? 'এডমিন পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!' : 'Admin password updated successfully!'
    });
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  };

  // Filtered users for management
  const filteredUsers = users.filter(u => {
    const query = userSearchQuery.toLowerCase();
    const matchesQuery = 
      u.name.toLowerCase().includes(query) ||
      (u.bengaliName && u.bengaliName.toLowerCase().includes(query)) ||
      (u.phone && u.phone.includes(query)) ||
      (u.bio && u.bio.toLowerCase().includes(query));

    if (!matchesQuery) return false;

    if (userFilter === 'active') return !u.isBlocked;
    if (userFilter === 'blocked') return !!u.isBlocked;
    return true;
  });

  const totalUsersCount = users.length;
  const blockedUsersCount = users.filter(u => u.isBlocked).length;
  const activeUsersCount = totalUsersCount - blockedUsersCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative bg-slate-900 border border-slate-700/80 w-full max-w-4xl h-[90vh] max-h-[720px] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. LOGIN SCREEN (If not authenticated) */}
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-xl shadow-emerald-600/20 mb-4 ring-4 ring-emerald-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">
              {lang === 'bn' ? 'সিকিউর এডমিন প্যানেল' : 'Secure Admin Portal'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              {lang === 'bn'
                ? 'এডমিন কন্ট্রোল অ্যাক্সেস করতে সিকিউরিটি পাসওয়ার্ড লিখুন'
                : 'Enter your admin password to access the management portal'}
            </p>

            <form onSubmit={handleLogin} className="w-full space-y-4">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setAuthError('');
                  }}
                  placeholder={lang === 'bn' ? 'এডমিন পাসওয়ার্ড লিখুন...' : 'Enter admin password...'}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {authError && (
                <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2 justify-center">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95"
              >
                <Unlock className="w-4 h-4" />
                <span>{lang === 'bn' ? 'লগইন করুন' : 'Unlock Portal'}</span>
              </button>

              <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-left text-[11px] text-slate-400">
                <span className="font-semibold text-emerald-400 block mb-0.5">
                  🔑 {lang === 'bn' ? 'ডিফল্ট এডমিন পাসওয়ার্ড:' : 'Default Admin Password:'}
                </span>
                <span className="font-mono bg-slate-900 px-2 py-0.5 rounded-md text-slate-200 border border-slate-800">
                  admin123
                </span>
                <span className="block mt-1 text-slate-500 text-[10px]">
                  {lang === 'bn' ? '(প্যানেলে প্রবেশের পর পাসওয়ার্ড পরিবর্তন করা যাবে)' : '(You can change it once logged in)'}
                </span>
              </div>
            </form>
          </div>
        ) : (
          /* 2. AUTHENTICATED ADMIN DASHBOARD */
          <>
            {/* Top Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-lg text-white">
                      {lang === 'bn' ? 'বার্তা এডমিন প্যানেল' : 'Barta Admin Center'}
                    </h2>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold rounded-full border border-emerald-500/30">
                      Master Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {lang === 'bn'
                      ? 'ব্যবহারকারী নিয়ন্ত্রণ, সার্বজনীন নোটিফিকেশন ও সিস্টেম ওভারভিউ'
                      : 'User controls, broadcast notifications and system analytics'}
                  </p>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="mr-8 sm:mr-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title={lang === 'bn' ? 'লগআউট' : 'Logout'}
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-5 border-b border-slate-800 flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar bg-slate-900/60">
              {[
                { id: 'dashboard', label: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Overview', icon: BarChart3 },
                { id: 'users', label: lang === 'bn' ? 'ব্যবহারকারী ব্যবস্থাপনা' : 'Users Management', icon: Users, badge: totalUsersCount },
                { id: 'broadcast', label: lang === 'bn' ? 'সবার জন্য নোটিফিকেশন' : 'Broadcast Notice', icon: Bell },
                { id: 'security', label: lang === 'bn' ? 'পাসওয়ার্ড সেটিংস' : 'Security', icon: Key }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 py-3 border-b-2 text-xs font-semibold transition-all shrink-0 ${
                      isActive
                        ? 'border-emerald-500 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded-full text-[10px] border border-slate-700">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {/* TAB 1: DASHBOARD OVERVIEW */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Metric Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-medium">
                          {lang === 'bn' ? 'মোট ব্যবহারকারী' : 'Total Users'}
                        </span>
                        <Users className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-2xl font-bold text-white">{totalUsersCount}</p>
                      <p className="text-[10px] text-emerald-400 mt-1">
                        {activeUsersCount} {lang === 'bn' ? 'সক্রিয় অ্যাকাউন্ট' : 'active accounts'}
                      </p>
                    </div>

                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-medium">
                          {lang === 'bn' ? 'ব্লকড ব্যবহারকারী' : 'Blocked Users'}
                        </span>
                        <UserX className="w-4 h-4 text-rose-400" />
                      </div>
                      <p className="text-2xl font-bold text-rose-400">{blockedUsersCount}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {blockedUsersCount > 0 
                          ? (lang === 'bn' ? 'মেসেজ পাঠানো স্থগিত' : 'Messaging suspended') 
                          : (lang === 'bn' ? 'কোনো ব্লক নেই' : 'Clean record')}
                      </p>
                    </div>

                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-medium">
                          {lang === 'bn' ? 'মোট চ্যাট রুম' : 'Total Chats'}
                        </span>
                        <MessageSquare className="w-4 h-4 text-cyan-400" />
                      </div>
                      <p className="text-2xl font-bold text-white">{chats.length}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {chats.filter(c => c.type === 'group').length} {lang === 'bn' ? 'গ্রুপ রুম' : 'group rooms'}
                      </p>
                    </div>

                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-medium">
                          {lang === 'bn' ? 'মোট আদান-প্রদান' : 'Total Messages'}
                        </span>
                        <BarChart3 className="w-4 h-4 text-amber-400" />
                      </div>
                      <p className="text-2xl font-bold text-white">{totalMessagesCount}</p>
                      <p className="text-[10px] text-emerald-400 mt-1">
                        {lang === 'bn' ? 'রিয়েল-টাইম সিঙ্ক সক্রিয়' : 'Live sync active'}
                      </p>
                    </div>
                  </div>

                  {/* Quick Action Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-800/80 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-white">
                          {lang === 'bn' ? 'সবাইকে জরুরি নোটিফিকেশন পাঠাতে চান?' : 'Need to send an alert to all users?'}
                        </h4>
                        <p className="text-xs text-slate-300">
                          {lang === 'bn' 
                            ? 'এক ক্লিকে সকল ব্যবহারকারীর ইনবক্সে ও স্ক্রিনের শীর্ষে নোটিফিকেশন পৌঁছে দিন।'
                            : 'Broadcast system updates directly to everyone in one click.'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('broadcast')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-all shadow-md shrink-0 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'নোটিফিকেশন তৈরি করুন' : 'Compose Notice'}</span>
                    </button>
                  </div>

                  {/* Active Announcements List */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      {lang === 'bn' ? 'সাম্প্রতিক সার্বজনীন নোটিফিকেশন' : 'Recent Broadcasts'}
                    </h3>
                    {announcements.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-4 bg-slate-800/30 rounded-xl">
                        {lang === 'bn' ? 'এখনো কোনো সার্বজনীন নোটিফিকেশন পাঠানো হয়নি।' : 'No broadcasts sent yet.'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {announcements.map(ann => (
                          <div 
                            key={ann.id} 
                            className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-white">{ann.title}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-700 text-slate-300">
                                  {ann.type}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 truncate mt-0.5">{ann.message}</p>
                            </div>
                            <button
                              onClick={() => onDeleteAnnouncement(ann.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700"
                              title="Delete announcement"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: USERS MANAGEMENT (View, Block/Unblock, Delete) */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder={lang === 'bn' ? 'ব্যবহারকারী খুঁজুন...' : 'Search users...'}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex gap-1.5 self-start sm:self-auto">
                      {[
                        { id: 'all', label: lang === 'bn' ? 'সকল' : 'All', count: totalUsersCount },
                        { id: 'active', label: lang === 'bn' ? 'সক্রিয়' : 'Active', count: activeUsersCount },
                        { id: 'blocked', label: lang === 'bn' ? 'ব্লকড' : 'Blocked', count: blockedUsersCount }
                      ].map(filter => (
                        <button
                          key={filter.id}
                          onClick={() => setUserFilter(filter.id as typeof userFilter)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
                            userFilter === filter.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{filter.label}</span>
                          <span className="text-[10px] opacity-80">({filter.count})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Users Table / List */}
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/80 divide-y divide-slate-800">
                    {filteredUsers.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        {lang === 'bn' ? 'কোনো ব্যবহারকারী পাওয়া যায়নি।' : 'No users match criteria.'}
                      </div>
                    ) : (
                      filteredUsers.map(user => {
                        const isMe = user.id === currentUser.id;
                        return (
                          <div 
                            key={user.id} 
                            className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                              user.isBlocked ? 'bg-rose-950/20' : 'hover:bg-slate-800/40'
                            }`}
                          >
                            {/* User Avatar & Info */}
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative shrink-0">
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className={`w-11 h-11 rounded-full object-cover ring-2 ${
                                    user.isBlocked 
                                      ? 'ring-rose-500 grayscale' 
                                      : 'ring-emerald-500/60'
                                  }`}
                                />
                                {user.isBlocked ? (
                                  <span className="absolute -bottom-1 -right-1 p-0.5 bg-rose-600 rounded-full text-white">
                                    <ShieldAlert className="w-3 h-3" />
                                  </span>
                                ) : user.status === 'online' ? (
                                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
                                ) : null}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-white truncate">
                                    {user.name}
                                  </span>
                                  {user.role === 'admin' && (
                                    <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded-md border border-emerald-500/30">
                                      Admin
                                    </span>
                                  )}
                                  {user.isBlocked && (
                                    <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 text-[10px] font-semibold rounded-md border border-rose-500/30">
                                      {lang === 'bn' ? 'ব্লকড' : 'Blocked'}
                                    </span>
                                  )}
                                  {isMe && (
                                    <span className="text-[10px] text-slate-500">
                                      ({lang === 'bn' ? 'আপনি' : 'You'})
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 truncate">{user.bio}</p>
                                <p className="text-[11px] text-slate-500 font-mono">{user.phone}</p>
                              </div>
                            </div>

                            {/* Action Buttons: Block/Unblock, Delete */}
                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                              {/* Block / Unblock Toggle Button */}
                              {user.isBlocked ? (
                                <button
                                  onClick={() => onUnblockUser(user.id)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-medium flex items-center gap-1.5 transition-colors"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>{lang === 'bn' ? 'আনব্লক করুন' : 'Unblock'}</span>
                                </button>
                              ) : (
                                <button
                                  disabled={isMe}
                                  onClick={() => onBlockUser(user.id)}
                                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                  title={isMe ? 'Cannot block yourself' : 'Block user from sending messages'}
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>{lang === 'bn' ? 'ব্লক করুন' : 'Block User'}</span>
                                </button>
                              )}

                              {/* Delete Button */}
                              <button
                                disabled={isMe}
                                onClick={() => setUserToDelete(user)}
                                className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                title={isMe ? 'Cannot delete yourself' : 'Permanently delete user'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: BROADCAST NOTIFICATION TO EVERYONE */}
              {activeTab === 'broadcast' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Broadcast Composer */}
                  <form onSubmit={handleSendBroadcast} className="space-y-4">
                    <div>
                      <h3 className="font-bold text-sm text-white mb-1 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-emerald-400" />
                        <span>{lang === 'bn' ? 'সবাইকে নোটিফিকেশন পাঠান' : 'Broadcast to All Users'}</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        {lang === 'bn'
                          ? 'এই নোটিফিকেশনটি সকল সক্রিয় ব্যবহারকারীর ডিভাইসে প্রদর্শিত হবে।'
                          : 'This notice will be sent to all users and displayed across the app.'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {lang === 'bn' ? 'নোটিফিকেশনের শিরোনাম' : 'Notification Title'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={annTitle}
                        onChange={(e) => setAnnTitle(e.target.value)}
                        placeholder={lang === 'bn' ? 'যেমন: নতুন ফিচার আপডেট বা শুভেচ্ছা' : 'e.g. System Maintenance Notice'}
                        className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {lang === 'bn' ? 'নোটিফিকেশনের ধরণ' : 'Type / Urgency'}
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'info', label: lang === 'bn' ? 'তথ্য' : 'Info', color: 'border-cyan-500/40 text-cyan-400' },
                          { id: 'warning', label: lang === 'bn' ? 'সতর্কতা' : 'Warning', color: 'border-amber-500/40 text-amber-400' },
                          { id: 'alert', label: lang === 'bn' ? 'এলার্ট' : 'Alert', color: 'border-rose-500/40 text-rose-400' },
                          { id: 'celebration', label: lang === 'bn' ? 'উৎসব' : 'Celebration', color: 'border-emerald-500/40 text-emerald-400' }
                        ].map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setAnnType(t.id as typeof annType)}
                            className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                              annType === t.id
                                ? `bg-slate-800 ${t.color} ring-1 ring-emerald-500`
                                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {lang === 'bn' ? 'বার্তার বিবরণ' : 'Announcement Message'} *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={annMessage}
                        onChange={(e) => setAnnMessage(e.target.value)}
                        placeholder={lang === 'bn' ? 'সকল ব্যবহারকারীর উদ্দেশ্যে আপনার বার্তাটি লিখুন...' : 'Write the message to be broadcasted to everyone...'}
                        className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>

                    {/* Delivery Options */}
                    <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
                      <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={postToChats}
                          onChange={(e) => setPostToChats(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-600"
                        />
                        <span>
                          {lang === 'bn' 
                            ? 'সকল চ্যাটে সিস্টেম মেসেজ হিসেবে পোস্ট করুন' 
                            : 'Also deliver as a message into every chat channel'}
                        </span>
                      </label>
                    </div>

                    {broadcastSuccess && (
                      <div className="p-3 bg-emerald-600/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {lang === 'bn' 
                            ? 'সবার কাছে নোটিফিকেশন সফলভাবে পাঠানো হয়েছে!' 
                            : 'Notification broadcasted to all users successfully!'}
                        </span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!annTitle.trim() || !annMessage.trim()}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      <Send className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'সবার কাছে নোটিফিকেশন পাঠান' : 'Broadcast to Everyone'}</span>
                    </button>
                  </form>

                  {/* Live Preview Box */}
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lang === 'bn' ? 'নোটিফিকেশন প্রিভিউ (ব্যবহারকারীরা যা দেখবে)' : 'Live Preview'}</span>
                    </span>

                    <div className="flex-1 bg-slate-950/80 rounded-2xl border border-slate-800 p-4 flex flex-col justify-center">
                      <div className={`p-4 rounded-2xl border shadow-xl ${
                        annType === 'warning'
                          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                          : annType === 'alert'
                          ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                          : annType === 'celebration'
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                          : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Bell className="w-4 h-4 shrink-0" />
                          <h4 className="font-bold text-sm text-white">
                            {annTitle || (lang === 'bn' ? 'নোটিফিকেশনের শিরোনাম' : 'Notification Title')}
                          </h4>
                          <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-white/10 uppercase font-semibold">
                            {annType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {annMessage || (lang === 'bn' ? 'এখানে আপনার বিস্তারিত বার্তা প্রদর্শিত হবে...' : 'Your detailed message will appear here...')}
                        </p>
                      </div>

                      <p className="text-[11px] text-slate-500 text-center mt-4">
                        {lang === 'bn' 
                          ? '💡 এটি অ্যাপের শীর্ষে একটি সুন্দর ব্যানার হিসেবে এবং চ্যাটে বার্তা হিসেবে শো করবে।'
                          : '💡 This will show as a prominent top banner and as a chat message.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SECURITY & PASSWORD SETTINGS */}
              {activeTab === 'security' && (
                <div className="max-w-md mx-auto space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                    <h3 className="font-bold text-sm text-white mb-1 flex items-center gap-2">
                      <Key className="w-4 h-4 text-emerald-400" />
                      <span>{lang === 'bn' ? 'এডমিন পাসওয়ার্ড পরিবর্তন' : 'Change Admin Password'}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      {lang === 'bn'
                        ? 'আপনার এডমিন প্যানেল সুরক্ষিত রাখতে নিয়মিত পাসওয়ার্ড পরিবর্তন করুন।'
                        : 'Update your admin password to maintain secure portal access.'}
                    </p>

                    <form onSubmit={handleChangePassword} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          {lang === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
                        </label>
                        <input
                          type="password"
                          required
                          value={currentPass}
                          onChange={(e) => setCurrentPass(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          {lang === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
                        </label>
                        <input
                          type="password"
                          required
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          {lang === 'bn' ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPass}
                          onChange={(e) => setConfirmPass(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                        />
                      </div>

                      {passChangeStatus && (
                        <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                          passChangeStatus.success 
                            ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40' 
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {passChangeStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                          <span>{passChangeStatus.message}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-md mt-2"
                      >
                        {lang === 'bn' ? 'পাসওয়ার্ড আপডেট করুন' : 'Update Password'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

            </div>
          </>
        )}

      </div>

      {/* Confirmation Modal for Deleting User */}
      {userToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 max-w-sm w-full p-5 rounded-2xl shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-white mb-1">
              {lang === 'bn' ? 'ব্যবহারকারী ডিলিট করবেন?' : 'Delete User?'}
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              {lang === 'bn' 
                ? `আপনি কি নিশ্চিতভাবে "${userToDelete.name}"-কে স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।`
                : `Are you sure you want to permanently delete "${userToDelete.name}"? This action cannot be undone.`}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  onDeleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors"
              >
                {lang === 'bn' ? 'হ্যাঁ, ডিলিট করুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
