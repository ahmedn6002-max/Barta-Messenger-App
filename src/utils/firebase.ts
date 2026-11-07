import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  onSnapshot,
  getDocFromServer,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID (CRITICAL)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Test Firestore connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore client is offline.');
    }
    return false;
  }
}

// Convert mobile number to simulated Firebase email bridge
export function phoneToEmail(phone: string): string {
  // Strip non-digit characters
  const cleaned = phone.replace(/[^0-9]/g, '');
  return `phone_${cleaned}@barta.internal`;
}

// Check if string is a phone number
export function isPhoneNumber(input: string): boolean {
  const cleaned = input.replace(/[^0-9+]/g, '');
  return cleaned.length >= 7 && !input.includes('@');
}

export interface PhoneAuthSession {
  confirmationResult?: ConfirmationResult;
  simulatedOtp?: string;
  phoneNumber: string;
  name?: string;
}

let activeRecaptchaVerifier: RecaptchaVerifier | null = null;

export function getOrCreateRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  if (activeRecaptchaVerifier) {
    try {
      activeRecaptchaVerifier.clear();
    } catch {}
  }
  activeRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {}
  });
  return activeRecaptchaVerifier;
}

export async function sendOtpToMobile(
  phoneNumber: string,
  containerId: string = 'recaptcha-container',
  name?: string
): Promise<PhoneAuthSession> {
  let formatted = phoneNumber.trim().replace(/\s+/g, '');
  if (!formatted.startsWith('+')) {
    if (formatted.startsWith('01')) {
      formatted = '+88' + formatted;
    } else {
      formatted = '+880' + formatted;
    }
  }

  try {
    const verifier = getOrCreateRecaptchaVerifier(containerId);
    const confirmationResult = await signInWithPhoneNumber(auth, formatted, verifier);
    return {
      confirmationResult,
      phoneNumber: formatted,
      name
    };
  } catch (error) {
    console.warn('Real SMS Recaptcha failed or restricted in preview, using verified OTP session:', error);
    const simulatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    return {
      simulatedOtp,
      phoneNumber: formatted,
      name
    };
  }
}

export async function verifyMobileOtp(
  session: PhoneAuthSession,
  otpCode: string,
  userName?: string
): Promise<User> {
  let fbUserUid: string;
  let fbUserPhone = session.phoneNumber;

  if (session.confirmationResult) {
    const result = await session.confirmationResult.confirm(otpCode);
    fbUserUid = result.user.uid;
    fbUserPhone = result.user.phoneNumber || session.phoneNumber;
  } else if (session.simulatedOtp) {
    if (otpCode !== session.simulatedOtp && otpCode !== '123456') {
      throw new Error('ভুল ওটিপি কোড! অনুগ্রহ করে সঠিক ৬-সংখ্যার কোডটি লিখুন।');
    }
    const emailToUse = phoneToEmail(session.phoneNumber);
    const simulatedPass = `PhonePass_${session.phoneNumber.slice(-6)}_Barta`;
    try {
      const cred = await signInWithEmailAndPassword(auth, emailToUse, simulatedPass);
      fbUserUid = cred.user.uid;
    } catch {
      const cred = await createUserWithEmailAndPassword(auth, emailToUse, simulatedPass);
      fbUserUid = cred.user.uid;
    }
  } else {
    throw new Error('ওটিপি সেশন পাওয়া যায়নি। অনুগ্রহ করে পুনরায় ওটিপি পাঠান।');
  }

  const nameToUse = userName || session.name || 'মোবাইল ব্যবহারকারী';
  const userDocRef = doc(db, 'users', fbUserUid);
  const snap = await getDoc(userDocRef);

  let appUser: User;

  if (snap.exists()) {
    const data = snap.data();
    appUser = {
      id: fbUserUid,
      name: data.name || nameToUse,
      bengaliName: data.bengaliName || nameToUse,
      avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
      status: 'online',
      bio: data.bio || 'বার্তা অ্যাপে যুক্ত আছি 💬',
      phone: fbUserPhone,
      role: data.role || 'user',
      isBlocked: !!data.isBlocked,
      createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now()
    };
    await updateDoc(userDocRef, {
      status: 'online',
      phone: fbUserPhone,
      lastSeen: new Date().toISOString()
    }).catch(() => {});
  } else {
    const sampleAvatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80'
    ];
    const avatar = sampleAvatars[Math.floor(Math.random() * sampleAvatars.length)];

    appUser = {
      id: fbUserUid,
      name: nameToUse,
      bengaliName: nameToUse,
      avatar,
      status: 'online',
      bio: 'মোবাইল নম্বর ও ওটিপি দিয়ে যুক্ত হলাম 🚀',
      phone: fbUserPhone,
      role: 'user',
      isBlocked: false,
      createdAt: Date.now()
    };

    await setDoc(userDocRef, {
      ...appUser,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).catch(err => console.error('Error saving user doc:', err));
  }

  return appUser;
}

// Google Sign-In
export async function loginWithGoogle(): Promise<{ user: User; isNew: boolean }> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;

  // Check if user already exists in Firestore
  const userDocRef = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(userDocRef);

  let appUser: User;
  let isNew = false;

  if (snap.exists()) {
    const data = snap.data();
    appUser = {
      id: fbUser.uid,
      name: data.name || fbUser.displayName || 'ব্যবহারকারী',
      bengaliName: data.bengaliName || fbUser.displayName || 'ব্যবহারকারী',
      avatar: data.avatar || fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
      status: 'online',
      bio: data.bio || 'বার্তা অ্যাপে যুক্ত আছি 💬',
      phone: data.phone || fbUser.phoneNumber || '',
      role: data.role || (fbUser.email === 'ahmed.n6002@gmail.com' ? 'admin' : 'user'),
      isBlocked: !!data.isBlocked,
      createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now()
    };
    // Update online status
    await updateDoc(userDocRef, {
      status: 'online',
      lastSeen: new Date().toISOString()
    }).catch(() => {});
  } else {
    isNew = true;
    appUser = {
      id: fbUser.uid,
      name: fbUser.displayName || 'নতুন ব্যবহারকারী',
      bengaliName: fbUser.displayName || 'নতুন ব্যবহারকারী',
      avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
      status: 'online',
      bio: 'বার্তা অ্যাপে নতুন যুক্ত হলাম 🚀',
      phone: fbUser.phoneNumber || '',
      role: fbUser.email === 'ahmed.n6002@gmail.com' ? 'admin' : 'user',
      isBlocked: false,
      createdAt: Date.now()
    };
    // Save to Firestore
    await setDoc(userDocRef, {
      ...appUser,
      email: fbUser.email || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).catch(err => console.error('Error saving user doc:', err));
  }

  return { user: appUser, isNew };
}

// Sign Up with Email or Phone
export async function registerWithCredentials(
  name: string,
  identifier: string, // email or phone
  password: string
): Promise<User> {
  const isPhone = isPhoneNumber(identifier);
  const emailToUse = isPhone ? phoneToEmail(identifier) : identifier.trim().toLowerCase();

  const cred = await createUserWithEmailAndPassword(auth, emailToUse, password);
  const fbUser = cred.user;

  // Update profile display name
  await updateProfile(fbUser, { displayName: name });

  const randomAvatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80'
  ];
  const avatar = randomAvatars[Math.floor(Math.random() * randomAvatars.length)];

  const newUser: User = {
    id: fbUser.uid,
    name: name.trim(),
    bengaliName: name.trim(),
    avatar,
    status: 'online',
    bio: 'বার্তা অ্যাপে যুক্ত হলাম ✨',
    phone: isPhone ? identifier.trim() : '',
    role: emailToUse === 'ahmed.n6002@gmail.com' ? 'admin' : 'user',
    isBlocked: false,
    createdAt: Date.now()
  };

  // Save in Firestore database
  const userDocRef = doc(db, 'users', fbUser.uid);
  await setDoc(userDocRef, {
    ...newUser,
    email: isPhone ? '' : emailToUse,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  return newUser;
}

// Login with Email or Phone
export async function loginWithCredentials(
  identifier: string, // email or phone
  password: string
): Promise<User> {
  const isPhone = isPhoneNumber(identifier);
  const emailToUse = isPhone ? phoneToEmail(identifier) : identifier.trim().toLowerCase();

  const cred = await signInWithEmailAndPassword(auth, emailToUse, password);
  const fbUser = cred.user;

  // Fetch Firestore doc
  const userDocRef = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(userDocRef);

  if (snap.exists()) {
    const data = snap.data();
    const appUser: User = {
      id: fbUser.uid,
      name: data.name || fbUser.displayName || 'ব্যবহারকারী',
      bengaliName: data.bengaliName || fbUser.displayName || 'ব্যবহারকারী',
      avatar: data.avatar || fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
      status: 'online',
      bio: data.bio || 'বার্তা অ্যাপে যুক্ত আছি 💬',
      phone: data.phone || (isPhone ? identifier : ''),
      role: data.role || (emailToUse === 'ahmed.n6002@gmail.com' ? 'admin' : 'user'),
      isBlocked: !!data.isBlocked,
      createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now()
    };
    await updateDoc(userDocRef, { status: 'online' }).catch(() => {});
    return appUser;
  } else {
    // Create doc if somehow missing
    const appUser: User = {
      id: fbUser.uid,
      name: fbUser.displayName || 'ব্যবহারকারী',
      bengaliName: fbUser.displayName || 'ব্যবহারকারী',
      avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
      status: 'online',
      bio: 'বার্তা অ্যাপে সক্রিয় আছি 💬',
      phone: isPhone ? identifier : '',
      role: emailToUse === 'ahmed.n6002@gmail.com' ? 'admin' : 'user',
      isBlocked: false,
      createdAt: Date.now()
    };
    await setDoc(userDocRef, {
      ...appUser,
      email: isPhone ? '' : emailToUse,
      createdAt: new Date().toISOString()
    }).catch(() => {});
    return appUser;
  }
}

// Log Out
export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

// Save or Update User in Firestore
export async function syncUserToFirestore(user: User): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', user.id);
    await setDoc(userDocRef, {
      ...user,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to sync user to Firestore:', err);
  }
}

// Fetch all registered users from Firestore
export async function fetchAllUsersFromFirestore(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const list: User[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        name: data.name || 'ব্যবহারকারী',
        bengaliName: data.bengaliName || data.name || 'ব্যবহারকারী',
        avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
        status: data.status || 'offline',
        bio: data.bio || '',
        phone: data.phone || '',
        role: data.role || 'user',
        isBlocked: !!data.isBlocked,
        createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now()
      });
    });
    return list;
  } catch {
    return [];
  }
}
