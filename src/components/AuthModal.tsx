import React, { useState } from 'react';
import { User, Language } from '../types';
import { 
  loginWithGoogle, 
  loginWithCredentials, 
  registerWithCredentials 
} from '../utils/firebase';
import { soundManager } from '../utils/sound';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  lang: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  lang
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState(''); // email or mobile
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Friendly error message parser
  const getFriendlyError = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
      return lang === 'bn' ? 'ভুল ইমেল/মোবাইল বা পাসওয়ার্ড!' : 'Incorrect credentials. Please try again.';
    }
    if (msg.includes('auth/user-not-found')) {
      return lang === 'bn' ? 'এই অ্যাকাউন্টের কোনো ব্যবহারকারী পাওয়া যায়নি।' : 'No account found with this email/phone.';
    }
    if (msg.includes('auth/email-already-in-use')) {
      return lang === 'bn' ? 'এই ইমেল বা মোবাইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট রয়েছে। লগইন করুন।' : 'Account already exists. Please log in.';
    }
    if (msg.includes('auth/weak-password')) {
      return lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.';
    }
    if (msg.includes('auth/popup-closed-by-user')) {
      return lang === 'bn' ? 'গুগল সাইন-ইন উইন্ডো বন্ধ করা হয়েছে।' : 'Google sign-in was cancelled.';
    }
    return lang === 'bn' ? 'ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Authentication failed. Please check your inputs.';
  };

  // Google Login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage('');
    try {
      const { user } = await loginWithGoogle();
      soundManager.playReaction();
      confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      setErrorMessage(getFriendlyError(err));
      soundManager.playHangup();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Form Submit (Credentials)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage(lang === 'bn' ? 'ইমেল বা মোবাইল নম্বর লিখুন।' : 'Please enter email or phone number.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      let loggedInUser: User;
      if (mode === 'signup') {
        if (!name.trim()) {
          setErrorMessage(lang === 'bn' ? 'আপনার নাম লিখুন।' : 'Please enter your name.');
          setIsLoading(false);
          return;
        }
        loggedInUser = await registerWithCredentials(name, identifier, password);
      } else {
        loggedInUser = await loginWithCredentials(identifier, password);
      }

      soundManager.playReceived();
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      onAuthSuccess(loggedInUser);
      onClose();
    } catch (err) {
      setErrorMessage(getFriendlyError(err));
      soundManager.playHangup();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Header */}
        <div className="p-6 pb-4 text-center border-b border-slate-800/80 bg-slate-950/40">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/20">
            <MessageSquare className="w-7 h-7 text-white fill-current" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {mode === 'login' 
              ? (lang === 'bn' ? 'বার্তা অ্যাপে লগইন করুন' : 'Sign in to Barta')
              : (lang === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create Barta Account')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login'
              ? (lang === 'bn' ? 'আপনার ডেটাবেজ প্রোফাইলে প্রবেশ করুন' : 'Access your cloud synced profile')
              : (lang === 'bn' ? 'সহজেই যুক্ত হোন এবং মেসেজিং শুরু করুন' : 'Join and start instant messaging')}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-slate-800/80 rounded-xl mt-4 border border-slate-700/60">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'bn' ? 'লগইন' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMessage(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'bn' ? 'সাইন-আপ' : 'Sign Up'}
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          
          {/* Google Sign In Button */}
          <button
            type="button"
            disabled={isGoogleLoading || isLoading}
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-medium text-xs rounded-xl flex items-center justify-center gap-3 transition-all shadow-md hover:scale-[1.01] active:scale-95 disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {mode === 'login'
                ? (lang === 'bn' ? 'গুগল দিয়ে লগইন করুন' : 'Sign in with Google')
                : (lang === 'bn' ? 'গুগল দিয়ে সাইন-আপ করুন' : 'Sign up with Google')}
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[11px] text-slate-500 uppercase font-semibold">
              {lang === 'bn' ? 'অথবা' : 'or'}
            </span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name field (Only in Sign Up) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {lang === 'bn' ? 'আপনার নাম' : 'Full Name'} *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: আহমেদ হোসেন' : 'e.g. John Doe'}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email or Mobile Number */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'bn' ? 'ইমেল বা মোবাইল নম্বর' : 'Email or Mobile Number'} *
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={lang === 'bn' ? 'user@example.com বা 01700000000' : 'user@example.com or +88017...'}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {lang === 'bn' 
                  ? 'ইমেল এড্রেস বা যেকোনো মোবাইল নাম্বার ব্যবহার করতে পারেন' 
                  : 'You can use an email address or mobile number'}
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'} *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login'
                      ? (lang === 'bn' ? 'লগইন করুন' : 'Sign In')
                      : (lang === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Privacy Note */}
          <div className="pt-2 text-center text-[10px] text-slate-500">
            <span className="flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>
                {lang === 'bn'
                  ? 'আপনার সকল তথ্য ফায়ারবেস ক্লাউড ডেটাবেজে সংরক্ষিত থাকবে।'
                  : 'Your information is safely stored in Firebase cloud database.'}
              </span>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
