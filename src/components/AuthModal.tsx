import React, { useState, useEffect } from 'react';
import { User, Language } from '../types';
import { 
  loginWithGoogle, 
  loginWithCredentials, 
  registerWithCredentials,
  sendOtpToMobile,
  verifyMobileOtp,
  PhoneAuthSession
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
  KeyRound,
  RotateCcw,
  ShieldCheck,
  Smartphone
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
  // Main tab: Mobile OTP or Email/Password
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp');

  // Mobile OTP states
  const [otpStep, setOtpStep] = useState<'input-phone' | 'verify-code'>('input-phone');
  const [phoneName, setPhoneName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneSession, setPhoneSession] = useState<PhoneAuthSession | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Email/Password states
  const [passMode, setPassMode] = useState<'login' | 'signup'>('login');
  const [emailName, setEmailName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPassLoading, setIsPassLoading] = useState(false);

  // General states
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  if (!isOpen) return null;

  // Friendly error message parser
  const getFriendlyError = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('auth/invalid-phone-number')) {
      return lang === 'bn' ? 'সঠিক মোবাইল নম্বর লিখুন (যেমন: 01700000000)।' : 'Please enter a valid phone number.';
    }
    if (msg.includes('auth/invalid-verification-code')) {
      return lang === 'bn' ? 'ভুল ওটিপি কোড! অনুগ্রহ করে সঠিক কোডটি দিন।' : 'Invalid OTP code. Please check and retry.';
    }
    if (msg.includes('auth/code-expired')) {
      return lang === 'bn' ? 'ওটিপি কোডের মেয়াদ শেষ হয়ে গেছে। পুনরায় ওটিপি পাঠান।' : 'OTP has expired. Please request a new one.';
    }
    if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
      return lang === 'bn' ? 'ভুল ইমেল বা পাসওয়ার্ড!' : 'Incorrect credentials. Please try again.';
    }
    if (msg.includes('auth/user-not-found')) {
      return lang === 'bn' ? 'এই অ্যাকাউন্টের কোনো ব্যবহারকারী পাওয়া যায়নি।' : 'No account found with this email.';
    }
    if (msg.includes('auth/email-already-in-use')) {
      return lang === 'bn' ? 'এই ইমেল দিয়ে ইতিমধ্যে অ্যাকাউন্ট রয়েছে। লগইন করুন।' : 'Account already exists. Please log in.';
    }
    if (msg.includes('auth/weak-password')) {
      return lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.';
    }
    if (msg.includes('auth/popup-closed-by-user')) {
      return lang === 'bn' ? 'গুগল সাইন-ইন উইন্ডো বন্ধ করা হয়েছে।' : 'Google sign-in was cancelled.';
    }
    return msg || (lang === 'bn' ? 'ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Authentication failed.');
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

  // 1. Send OTP to Mobile
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanNum = phoneNumber.replace(/[^0-9+]/g, '');
    if (cleanNum.length < 8) {
      setErrorMessage(lang === 'bn' ? 'সঠিক মোবাইল নম্বর লিখুন (যেমন: 017xxxxxxxx)।' : 'Please enter a valid mobile number.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const session = await sendOtpToMobile(phoneNumber, 'recaptcha-container', phoneName.trim() || undefined);
      setPhoneSession(session);
      setOtpStep('verify-code');
      setResendCountdown(60);
      soundManager.playSent();
    } catch (err) {
      setErrorMessage(getFriendlyError(err));
      soundManager.playHangup();
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 2. Verify OTP and Sign-up/Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneSession) return;
    if (otpCode.trim().length < 6) {
      setErrorMessage(lang === 'bn' ? 'অনুগ্রহ করে ৬-সংখ্যার ওটিপি কোডটি লিখুন।' : 'Please enter the 6-digit OTP code.');
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMessage('');

    try {
      const user = await verifyMobileOtp(phoneSession, otpCode.trim(), phoneName.trim() || undefined);
      soundManager.playReceived();
      confetti({ particleCount: 45, spread: 75, origin: { y: 0.6 } });
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      setErrorMessage(getFriendlyError(err));
      soundManager.playHangup();
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // 3. Email & Password Submit
  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage(lang === 'bn' ? 'ইমেল এড্রেস লিখুন।' : 'Please enter your email.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
      return;
    }

    setIsPassLoading(true);

    try {
      let user: User;
      if (passMode === 'signup') {
        if (!emailName.trim()) {
          setErrorMessage(lang === 'bn' ? 'আপনার নাম লিখুন।' : 'Please enter your name.');
          setIsPassLoading(false);
          return;
        }
        user = await registerWithCredentials(emailName, identifier, password);
      } else {
        user = await loginWithCredentials(identifier, password);
      }

      soundManager.playReceived();
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      setErrorMessage(getFriendlyError(err));
      soundManager.playHangup();
    } finally {
      setIsPassLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
        <div id="recaptcha-container" className="hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Header */}
        <div className="p-5 pb-3 text-center border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center mx-auto mb-2.5 shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/20">
            {authMethod === 'otp' ? (
              <Smartphone className="w-6 h-6 text-white" />
            ) : (
              <MessageSquare className="w-6 h-6 text-white fill-current" />
            )}
          </div>
          <h2 className="text-lg font-bold text-white">
            {authMethod === 'otp'
              ? (otpStep === 'input-phone'
                ? (lang === 'bn' ? 'মোবাইল নম্বর দিয়ে সাইন-আপ' : 'Sign up with Mobile Number')
                : (lang === 'bn' ? 'ওটিপি (OTP) যাচাইকরণ' : 'Verify OTP Code'))
              : (passMode === 'login'
                ? (lang === 'bn' ? 'ইমেল দিয়ে লগইন করুন' : 'Sign in with Email')
                : (lang === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create an Account'))}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {authMethod === 'otp'
              ? (lang === 'bn' ? 'মোবাইলে এসএমএস ওটিপি কোড দিয়ে সুরক্ষিতভাবে প্রবেশ করুন' : 'Fast and secure verification via SMS OTP')
              : (lang === 'bn' ? 'ক্লাউড ডেটাবেজে আপনার অ্যাকাউন্টে প্রবেশ করুন' : 'Sign in using your email and password')}
          </p>

          {/* Primary Method Selector: Mobile OTP vs Email/Password */}
          <div className="flex p-1 bg-slate-800/80 rounded-xl mt-3.5 border border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('otp');
                setOtpStep('input-phone');
                setErrorMessage('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMethod === 'otp'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'মোবাইল ও ওটিপি (OTP)' : 'Mobile & OTP'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('password');
                setErrorMessage('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMethod === 'password'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ইমেল ও পাসওয়ার্ড' : 'Email & Pass'}</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto">

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: MOBILE & OTP AUTHENTICATION */}
          {authMethod === 'otp' && (
            <div>
              {otpStep === 'input-phone' ? (
                /* Step 1: Input Name & Phone */
                <form onSubmit={handleSendOtp} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {lang === 'bn' ? 'আপনার নাম' : 'Your Full Name'} *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={phoneName}
                        onChange={(e) => setPhoneName(e.target.value)}
                        placeholder={lang === 'bn' ? 'যেমন: আহমেদ হোসেন' : 'e.g. John Doe'}
                        className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {lang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'} *
                    </label>
                    <div className="relative flex">
                      <div className="flex items-center gap-1.5 px-3 bg-slate-800 border border-r-0 border-slate-700 rounded-l-xl text-xs text-slate-300 shrink-0">
                        <span>🇧🇩</span>
                        <span className="font-mono text-slate-400">+৮৮০</span>
                      </div>
                      <input
                        type="tel"
                        required
                        autoFocus
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="01712-345678"
                        className="flex-1 bg-slate-800/90 border border-slate-700 rounded-r-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {lang === 'bn' 
                        ? 'আমরা এই নম্বরে এসএমএস এর মাধ্যমে একটি ৬-সংখ্যার ওটিপি কোড পাঠাবো।'
                        : 'A 6-digit OTP code will be sent to this mobile number.'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingOtp || !phoneNumber.trim()}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-50 mt-3"
                  >
                    {isSendingOtp ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Phone className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'ওটিপি কোড পাঠান' : 'Send OTP Code'}</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Step 2: Verify OTP Code */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {/* Phone number display banner & change button */}
                  <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-slate-400 block text-[10px]">
                          {lang === 'bn' ? 'কোড পাঠানো হয়েছে:' : 'Code sent to:'}
                        </span>
                        <span className="font-mono font-semibold text-white">
                          {phoneSession?.phoneNumber || phoneNumber}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep('input-phone');
                        setOtpCode('');
                        setErrorMessage('');
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      {lang === 'bn' ? 'নম্বর পরিবর্তন' : 'Edit'}
                    </button>
                  </div>

                  {/* Dev / Test OTP prompt chip (in preview environment) */}
                  {phoneSession?.simulatedOtp && (
                    <div 
                      onClick={() => setOtpCode(phoneSession.simulatedOtp!)}
                      className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between cursor-pointer hover:bg-emerald-950/60 transition-colors"
                      title={lang === 'bn' ? 'ক্লিক করে কোডটি স্বয়ংক্রিয়ভাবে বসান' : 'Click to autofill OTP'}
                    >
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          {lang === 'bn' ? 'টেস্ট ওটিপি কোড:' : 'Test OTP Code:'}{' '}
                          <span className="font-mono font-bold tracking-widest text-white ml-1">
                            {phoneSession.simulatedOtp}
                          </span>
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/40">
                        {lang === 'bn' ? 'বসান ➔' : 'Autofill ➔'}
                      </span>
                    </div>
                  )}

                  {/* 6-Digit OTP Input */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 text-center">
                      {lang === 'bn' ? '৬-সংখ্যার ওটিপি (OTP) লিখুন' : 'Enter 6-digit verification code'}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[0.5em] text-lg font-mono font-bold py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-hidden focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Resend OTP timer */}
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>
                      {resendCountdown > 0 ? (
                        <span>
                          {lang === 'bn' ? 'পুনরায় পাঠানো যাবে:' : 'Resend in:'}{' '}
                          <span className="font-mono text-emerald-400 font-medium">
                            {resendCountdown}s
                          </span>
                        </span>
                      ) : (
                        <span>{lang === 'bn' ? 'কোড পাননি?' : "Didn't receive code?"}</span>
                      )}
                    </span>
                    <button
                      type="button"
                      disabled={resendCountdown > 0 || isSendingOtp}
                      onClick={handleSendOtp}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'পুনরায় পাঠান' : 'Resend OTP'}</span>
                    </button>
                  </div>

                  {/* Verify button */}
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpCode.length < 6}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                  >
                    {isVerifyingOtp ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'যাচাই করুন ও সাইন-আপ সম্পন্ন করুন' : 'Verify & Complete Sign Up'}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: EMAIL & PASSWORD AUTHENTICATION */}
          {authMethod === 'password' && (
            <div>
              {/* Login / Sign Up mini-tabs */}
              <div className="flex p-0.5 bg-slate-800/60 rounded-lg mb-3 border border-slate-700/50">
                <button
                  type="button"
                  onClick={() => { setPassMode('login'); setErrorMessage(''); }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    passMode === 'login' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? 'লগইন' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => { setPassMode('signup'); setErrorMessage(''); }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    passMode === 'signup' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? 'রেজিস্ট্রেশন' : 'Register'}
                </button>
              </div>

              <form onSubmit={handleEmailPasswordSubmit} className="space-y-3">
                {passMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {lang === 'bn' ? 'আপনার নাম' : 'Full Name'} *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={emailName}
                        onChange={(e) => setEmailName(e.target.value)}
                        placeholder={lang === 'bn' ? 'যেমন: আহমেদ হোসেন' : 'e.g. John Doe'}
                        className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {lang === 'bn' ? 'ইমেল এড্রেস' : 'Email Address'} *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

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
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
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

                <button
                  type="submit"
                  disabled={isPassLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-md flex items-center justify-center gap-2 mt-2"
                >
                  {isPassLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>
                        {passMode === 'login'
                          ? (lang === 'bn' ? 'লগইন করুন' : 'Sign In')
                          : (lang === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account')}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Social Sign In Divider */}
          <div className="flex items-center gap-3 my-2 pt-1">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[10px] text-slate-500 uppercase font-semibold">
              {lang === 'bn' ? 'অথবা' : 'or'}
            </span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            disabled={isGoogleLoading || isSendingOtp || isVerifyingOtp || isPassLoading}
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
            <span>{lang === 'bn' ? 'গুগল দিয়ে দ্রুত সাইন-ইন' : 'Continue with Google'}</span>
          </button>

          {/* Security & Database Status Footer */}
          <div className="pt-2 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {lang === 'bn'
                ? 'মোবাইল নম্বর ও সকল তথ্য ক্লাউড ডেটাবেজে সম্পূর্ণ সুরক্ষিত।'
                : 'Mobile & account data securely stored in cloud Firestore database.'}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
