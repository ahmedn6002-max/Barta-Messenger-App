import React, { useState, useRef } from 'react';
import { User, Language } from '../types';
import { 
  Check, 
  UserCheck, 
  X, 
  LogIn, 
  LogOut, 
  Camera, 
  Upload, 
  Sparkles, 
  Link as LinkIcon, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Image as ImageIcon,
  Edit2
} from 'lucide-react';
import { soundManager } from '../utils/sound';

interface UserProfileModalProps {
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  onUpdateCurrentUser: (updated: User) => void;
  onOpenAuthModal: () => void;
  onLogOut: () => void;
  onClose: () => void;
  lang: Language;
}

// Curated high quality avatars for instant 1-click selection
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=300&h=300&q=80'
];

const PRESET_BIOS = [
  'বার্তা অ্যাপে সক্রিয় আছি 💬',
  'ব্যস্ত আছি, জরুরি হলে কল দিন 🚀',
  'কাজের মধ্যে আছি ⚡',
  'কফির বিরতিতে আছি ☕',
  'সবসময় অনলাইন ✨'
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  onUpdateCurrentUser,
  onOpenAuthModal,
  onLogOut,
  onClose,
  lang
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'switch'>('edit');
  
  // Edit Form State
  const [name, setName] = useState(currentUser.name || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || PRESET_AVATARS[0]);
  const [phone, setPhone] = useState(currentUser.phone || '');
  
  // Avatar Chooser Modal/Panel State
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compress & Resize uploaded image using HTML5 Canvas to fit nicely into local & Firestore document
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage(lang === 'bn' ? 'অনুগ্রহ করে একটি ছবি ফাইল নির্বাচন করুন' : 'Please select an image file');
      return;
    }

    // Limit original file size to 10MB to avoid browser lag
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(lang === 'bn' ? 'ছবির সাইজ ১০ মেগাবাইটের কম হতে হবে' : 'Image size must be under 10MB');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        // Draw to square canvas (300x300)
        const canvas = document.createElement('canvas');
        const size = 300;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Crop center square
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          
          // Export as optimized JPEG data URL
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatar(compressedDataUrl);
          setIsUploading(false);
          setShowAvatarPicker(false);
          soundManager.playReaction();
        } else {
          setIsUploading(false);
          setErrorMessage(lang === 'bn' ? 'ছবি প্রসেস করতে ব্যর্থ হয়েছে' : 'Failed to process image');
        }
      };
      img.onerror = () => {
        setIsUploading(false);
        setErrorMessage(lang === 'bn' ? 'ছবি লোড করা যায়নি' : 'Could not load image');
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Set Custom URL
  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    setAvatar(customUrlInput.trim());
    setCustomUrlInput('');
    setShowAvatarPicker(false);
    soundManager.playReaction();
  };

  // Generate Random Avatar
  const handleGenerateRandomAvatar = () => {
    const randomSeeds = ['Aria', 'Leo', 'Maya', 'Kabir', 'Zayan', 'Tara', 'Raihan', 'Nila', 'Felix', 'Zara'];
    const seed = randomSeeds[Math.floor(Math.random() * randomSeeds.length)] + '-' + Math.floor(Math.random() * 1000);
    const dicebearUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
    setAvatar(dicebearUrl);
    soundManager.playReaction();
  };

  // Save Profile Changes
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setErrorMessage(lang === 'bn' ? 'অনুগ্রহ করে আপনার নাম লিখুন' : 'Please enter your name');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const updatedUser: User = {
      ...currentUser,
      name: name.trim(),
      bengaliName: name.trim(),
      avatar,
      bio: bio.trim(),
      phone: phone.trim()
    };

    try {
      await onUpdateCurrentUser(updatedUser);
      soundManager.playSent();
      setSuccessMessage(lang === 'bn' ? 'প্রোফাইল ছবি ও তথ্য সফলভাবে আপডেট হয়েছে! 🎉' : 'Profile updated successfully! 🎉');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3500);
    } catch (err) {
      console.error(err);
      setErrorMessage(lang === 'bn' ? 'আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' : 'Failed to update. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl relative text-slate-100 max-h-[92vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {lang === 'bn' ? 'প্রোফাইল সেটিংস ও ছবি' : 'Profile Settings & Avatar'}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'bn' 
                ? 'আপনার প্রোফাইল ছবি এবং ব্যক্তিগত তথ্য পরিবর্তন করুন' 
                : 'Customize your avatar picture and personal information'}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl mb-4 border border-slate-700/60">
          <button
            onClick={() => {
              setActiveTab('edit');
              setShowAvatarPicker(false);
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'edit'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ছবি ও প্রোফাইল পরিবর্তন' : 'Edit Profile & Photo'}</span>
          </button>

          <button
            onClick={() => setActiveTab('switch')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'switch'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'প্রোফাইল স্যুইচ' : 'Switch Active User'}</span>
          </button>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <X className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Edit Profile & Photo */}
        {activeTab === 'edit' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            
            {/* Avatar Section */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex flex-col sm:flex-row items-center gap-4">
              
              {/* Avatar Preview with Camera overlay badge */}
              <div className="relative group shrink-0">
                <img
                  src={avatar}
                  alt={name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500/40 shadow-xl"
                />
                
                {/* Camera Click Badge */}
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg ring-3 ring-slate-900 transition-all hover:scale-110"
                  title={lang === 'bn' ? 'ছবি পরিবর্তন করুন' : 'Change photo'}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar Actions */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <h3 className="text-sm font-semibold text-white flex items-center justify-center sm:justify-start gap-1.5">
                  <span>{lang === 'bn' ? 'প্রোফাইল ছবি' : 'Profile Picture'}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'bn'
                    ? 'গ্যালারি থেকে আপলোড করুন বা রেডিমেড অবতার পছন্দ করুন'
                    : 'Upload from device or choose a curated avatar'}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{showAvatarPicker ? (lang === 'bn' ? 'অপশন বন্ধ করুন' : 'Close Picker') : (lang === 'bn' ? 'ছবি পরিবর্তন করুন' : 'Change Avatar')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-600/60"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lang === 'bn' ? 'ফাইল আপলোড' : 'Upload File'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateRandomAvatar}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
                    title={lang === 'bn' ? 'র‍্যান্ডম অবতার' : 'Random Avatar'}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lang === 'bn' ? 'র‍্যান্ডম' : 'Random'}</span>
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            {/* Avatar Picker Drawer (Expandable) */}
            {showAvatarPicker && (
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-emerald-500/30 space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'বাছাইকৃত প্রোফাইল ছবি নির্বাচন' : 'Choose a Curated Avatar'}</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {lang === 'bn' ? '১৬টি সুন্দর অবতার' : '16 Preset Avatars'}
                  </span>
                </div>

                {/* Preset Avatars Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {PRESET_AVATARS.map((presetUrl, idx) => {
                    const isSelected = avatar === presetUrl;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAvatar(presetUrl);
                          soundManager.playReaction();
                        }}
                        className={`relative aspect-square rounded-full overflow-hidden transition-all hover:scale-105 ${
                          isSelected 
                            ? 'ring-3 ring-emerald-400 scale-105 shadow-md shadow-emerald-500/30' 
                            : 'ring-1 ring-slate-700 hover:ring-slate-500 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img src={presetUrl} alt="Avatar option" className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-emerald-950/40 flex items-center justify-center">
                            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom URL Option */}
                <div className="pt-2 border-t border-slate-700/60">
                  <label className="text-[11px] text-slate-400 block mb-1.5 flex items-center gap-1.5">
                    <LinkIcon className="w-3 h-3 text-emerald-400" />
                    <span>{lang === 'bn' ? 'অথবা যেকোনো ছবির লিঙ্ক দিন:' : 'Or enter any web image URL:'}</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="https://example.com/my-photo.jpg"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      disabled={!customUrlInput.trim()}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-medium rounded-xl transition-colors"
                    >
                      {lang === 'bn' ? 'ব্যবহার করুন' : 'Apply'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Fields */}
            <div className="space-y-3.5">
              {/* Name Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'আপনার নাম' : 'Display Name'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'bn' ? 'আপনার পূর্ণ নাম' : 'Your display name'}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                  <Edit2 className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Bio / Status Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    {lang === 'bn' ? 'বায়ো / স্ট্যাটাস' : 'Bio / Status'}
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {bio.length}/80
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={80}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={lang === 'bn' ? 'আপনার বর্তমান স্ট্যাটাস লিখুন...' : 'Short bio or status...'}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
                />

                {/* Quick Bio Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PRESET_BIOS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setBio(preset)}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-emerald-300 border border-slate-700/60 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone / Contact */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'মোবাইল নম্বর / যোগাযোগ' : 'Mobile Phone / Contact'}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+8801XXXXXXXXX"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving || isUploading}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{lang === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setName(currentUser.name || '');
                  setBio(currentUser.bio || '');
                  setAvatar(currentUser.avatar || PRESET_AVATARS[0]);
                  setPhone(currentUser.phone || '');
                  setShowAvatarPicker(false);
                }}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition-colors"
                title={lang === 'bn' ? 'পূর্বাবস্থায় ফেরান' : 'Reset'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Switch Profile */}
        {activeTab === 'switch' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {/* Current Active Profile Card */}
            <div className="bg-slate-800/80 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white truncate text-sm">{currentUser.name}</span>
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/40">
                    {lang === 'bn' ? 'বর্তমান' : 'Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">{currentUser.bio}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{currentUser.phone}</p>
              </div>
            </div>

            {/* List of profiles to switch to */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {lang === 'bn' ? 'অন্য প্রোফাইলে স্যুইচ করুন' : 'Available Profiles'}
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {allUsers.map((user) => {
                  const isSelected = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSelectUser(user);
                        setName(user.name);
                        setBio(user.bio);
                        setAvatar(user.avatar);
                        setPhone(user.phone || '');
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                        isSelected 
                          ? 'bg-emerald-600/20 border border-emerald-500/50 text-white' 
                          : 'bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="relative">
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        {user.status === 'online' && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.bio}</p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-xs text-slate-400 flex items-center gap-2">
              <span>💡</span>
              <span>
                {lang === 'bn' 
                  ? 'টিপস: দুইজনের মধ্যে লাইভ চ্যাট দেখতে প্রোফাইল দ্রুত পরিবর্তন করতে পারেন!'
                  : 'Tip: Switch profiles to chat back-and-forth between characters!'}
              </span>
            </div>
          </div>
        )}

        {/* Footer: Account Auth Actions */}
        <div className="pt-4 mt-4 border-t border-slate-800 flex gap-2 shrink-0">
          <button
            onClick={() => {
              onClose();
              onOpenAuthModal();
            }}
            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'bn' ? 'সাইন-আপ / লগইন' : 'Sign Up / Login'}</span>
          </button>

          <button
            onClick={() => {
              onLogOut();
              onClose();
            }}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-rose-300 hover:text-rose-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            title={lang === 'bn' ? 'লগআউট' : 'Log Out'}
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
