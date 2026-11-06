import { Chat, Message, Story, User } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-me',
    name: 'আহমেদ (আমি)',
    bengaliName: 'আহমেদ',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
    status: 'online',
    bio: 'বার্তা অ্যাপ ব্যবহার করছি 💬',
    phone: '+৮৮০ ১৭০০-০০০০০০'
  },
  {
    id: 'user-tamim',
    name: 'তামিম ইকবাল',
    bengaliName: 'তামিম',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80',
    status: 'online',
    bio: 'কোডিং এবং কফি ☕️',
    phone: '+৮৮০ ১৭১১-১১২২৩৩'
  },
  {
    id: 'user-sumaiya',
    name: 'সুমাইয়া আক্তার',
    bengaliName: 'সুমাইয়া',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
    status: 'online',
    bio: 'ইউএক্স ডিজাইনার ও ফটোগ্রাফার ✨',
    phone: '+৮৮০ ১৯১২-৩৪৫৬৭৮'
  },
  {
    id: 'user-sabbir',
    name: 'সাব্বির রহমান',
    bengaliName: 'সাব্বir',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    status: 'offline',
    lastSeen: '১০ মিনিট আগে',
    bio: 'সদা হাসিখুশি 😊',
    phone: '+৮৮০ ১৮৩৩-৯৯৮৮৭৭'
  },
  {
    id: 'user-priya',
    name: 'প্রিয়া সেন',
    bengaliName: 'প্রিয়া',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    status: 'online',
    bio: 'বই পড়া এবং ভ্রমণ 📚✈️',
    phone: '+৮৮০ ১৬০০-১১২২৩৩'
  },
  {
    id: 'user-tanvir',
    name: 'তানভীর আহমেদ',
    bengaliName: 'তানভীর',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
    status: 'offline',
    lastSeen: 'গতকাল রাত ৯:৪৫',
    bio: 'কাজের মধ্যে আছি 💻',
    phone: '+৮৮০ ১৮১২-৪৫৬৭৮৯'
  }
];

export const INITIAL_STORIES: Story[] = [
  {
    id: 'story-1',
    userId: 'user-tamim',
    userName: 'তামিম ইকবাল',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    text: 'নতুন প্রজেক্টের কাজ প্রায় শেষ! দারুণ কিছু আসছে 🚀',
    timestamp: Date.now() - 3600000 * 2,
    viewed: false
  },
  {
    id: 'story-2',
    userId: 'user-sumaiya',
    userName: 'সুমাইয়া আক্তার',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    text: 'সুন্দর একটি বিকেল ও এক কাপ চা ☕️🌸',
    timestamp: Date.now() - 3600000 * 5,
    viewed: false
  },
  {
    id: 'story-3',
    userId: 'user-priya',
    userName: 'প্রিয়া সেন',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    text: 'সাগরের তীরে সূর্যাস্তের মনোরম দৃশ্য 🌅🌊',
    timestamp: Date.now() - 3600000 * 8,
    viewed: false
  }
];

export const INITIAL_CHATS: Chat[] = [
  {
    id: 'chat-tamim',
    type: 'direct',
    name: 'তামিম ইকবাল',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80',
    participants: ['user-me', 'user-tamim'],
    unreadCount: 1,
    isPinned: true,
    lastMessage: {
      text: 'দোস্ত, আজকের মিটিংটা কয়টায় শুরু হবে?',
      timestamp: Date.now() - 1000 * 60 * 5,
      senderName: 'তামিম ইকবাল',
      senderId: 'user-tamim'
    }
  },
  {
    id: 'chat-group-friends',
    type: 'group',
    name: 'বন্ধুমহল 🚀 Friends Group',
    avatar: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=200&h=200&q=80',
    participants: ['user-me', 'user-tamim', 'user-sumaiya', 'user-sabbir', 'user-priya'],
    unreadCount: 3,
    isPinned: true,
    groupDescription: 'আমাদের পুরোনো বন্ধুদের আড্ডার গ্রুপ! যেকোনো প্ল্যান এখানে হবে।',
    lastMessage: {
      text: 'সুমাইয়া: এই শুক্রবারে সবাই চল একটু বাইরে যাই!',
      timestamp: Date.now() - 1000 * 60 * 20,
      senderName: 'সুমাইয়া আক্তার',
      senderId: 'user-sumaiya'
    }
  },
  {
    id: 'chat-sumaiya',
    type: 'direct',
    name: 'সুমাইয়া আক্তার',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
    participants: ['user-me', 'user-sumaiya'],
    unreadCount: 0,
    lastMessage: {
      text: 'ডিজাইনের ফাইলটা পাঠিয়ে দিয়েছি, দেখে জানিও।',
      timestamp: Date.now() - 1000 * 60 * 120,
      senderName: 'সুমাইয়া আক্তার',
      senderId: 'user-sumaiya'
    }
  },
  {
    id: 'chat-group-office',
    type: 'group',
    name: 'অফিস টিম 💻 Dev Team',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&h=200&q=80',
    participants: ['user-me', 'user-tamim', 'user-tanvir'],
    unreadCount: 0,
    groupDescription: 'অফিসের প্রতিদিনের আপডেট এবং টাস্ক ট্র্যাকিং।',
    lastMessage: {
      text: 'তানভীর: পিআর রিভিউ সম্পন্ন হয়েছে 👍',
      timestamp: Date.now() - 1000 * 60 * 300,
      senderName: 'তানভীর আহমেদ',
      senderId: 'user-tanvir'
    }
  },
  {
    id: 'chat-priya',
    type: 'direct',
    name: 'প্রিয়া সেন',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    participants: ['user-me', 'user-priya'],
    unreadCount: 0,
    lastMessage: {
      text: 'কেমন আছো? অনেকদিন কথা হয় না!',
      timestamp: Date.now() - 1000 * 60 * 1440,
      senderName: 'প্রিয়া সেন',
      senderId: 'user-priya'
    }
  }
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  'chat-tamim': [
    {
      id: 'm-tamim-1',
      chatId: 'chat-tamim',
      senderId: 'user-tamim',
      senderName: 'তামিম ইকবাল',
      senderAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80',
      text: 'আসসালামু আলাইকুম ভাই! কেমন আছেন?',
      timestamp: Date.now() - 1000 * 60 * 60,
      status: 'read',
      reactions: { '❤️': ['user-me'] }
    },
    {
      id: 'm-tamim-2',
      chatId: 'chat-tamim',
      senderId: 'user-me',
      senderName: 'আহমেদ',
      senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
      text: 'ওয়ালাইকুমুস সালাম তামিম! আলহামদুলিল্লাহ ভালো। তোমার খবর বলো?',
      timestamp: Date.now() - 1000 * 60 * 55,
      status: 'read',
      reactions: { '👍': ['user-tamim'] }
    },
    {
      id: 'm-tamim-3',
      chatId: 'chat-tamim',
      senderId: 'user-tamim',
      senderName: 'তামিম ইকবাল',
      senderAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80',
      text: 'আমিও ভালো। নতুন অ্যাপের ইন্টারফেসটা কেমন লাগছে একটু দেখুন তো!',
      timestamp: Date.now() - 1000 * 60 * 30,
      status: 'read',
      reactions: {},
      attachments: [
        {
          id: 'att-1',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
          name: 'app_ui_mockup.jpg'
        }
      ]
    },
    {
      id: 'm-tamim-4',
      chatId: 'chat-tamim',
      senderId: 'user-me',
      senderName: 'আহমেদ',
      senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
      text: 'অসাধারণ হয়েছে! কালার কম্বিনেশন আর অ্যানিমেশন চমৎকার লাগছে 🔥',
      timestamp: Date.now() - 1000 * 60 * 25,
      status: 'read',
      reactions: { '🔥': ['user-tamim'] },
      replyTo: {
        id: 'm-tamim-3',
        senderName: 'তামিম ইকবাল',
        text: 'আমিও ভালো। নতুন অ্যাপের ইন্টারফেসটা কেমন লাগছে...'
      }
    },
    {
      id: 'm-tamim-5',
      chatId: 'chat-tamim',
      senderId: 'user-tamim',
      senderName: 'তামিম ইকবাল',
      senderAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80',
      text: 'দোস্ত, আজকের মিটিংটা কয়টায় শুরু হবে?',
      timestamp: Date.now() - 1000 * 60 * 5,
      status: 'delivered',
      reactions: {}
    }
  ],
  'chat-group-friends': [
    {
      id: 'm-gf-1',
      chatId: 'chat-group-friends',
      senderId: 'user-sabbir',
      senderName: 'সাব্বির রহমান',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
      text: 'কিরে সবাই কই? কতদিন দেখা হয় না সবার সাথে!',
      timestamp: Date.now() - 1000 * 60 * 120,
      status: 'read',
      reactions: { '❤️': ['user-priya', 'user-tamim'] }
    },
    {
      id: 'm-gf-2',
      chatId: 'chat-group-friends',
      senderId: 'user-priya',
      senderName: 'প্রিয়া সেন',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
      text: 'সত্যি! এই উইকেন্ডে কোথাও বসা যায় কিনা বলো?',
      timestamp: Date.now() - 1000 * 60 * 90,
      status: 'read',
      reactions: { '👍': ['user-me'] }
    },
    {
      id: 'm-gf-3',
      chatId: 'chat-group-friends',
      senderId: 'user-sumaiya',
      senderName: 'সুমাইয়া আক্তার',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
      text: 'এই শুক্রবারে সবাই চল একটু বাইরে যাই!',
      timestamp: Date.now() - 1000 * 60 * 20,
      status: 'read',
      reactions: { '🎉': ['user-tamim', 'user-sabbir'] }
    }
  ]
};

// Storage helper keys
const STORAGE_PREFIX = 'barta_messenger_';

export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(STORAGE_PREFIX + key);
    return val ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStoredData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage might be full or private mode
  }
}

// Multi-tab Broadcast Channel
export const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('barta_live_sync')
  : null;
