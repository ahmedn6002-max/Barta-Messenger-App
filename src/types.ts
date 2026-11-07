export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // userIds
}

export interface Attachment {
  id: string;
  type: 'image' | 'audio' | 'file';
  url: string;
  name: string;
  size?: string;
  duration?: number; // for audio in seconds
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  status: MessageStatus;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  attachments?: Attachment[];
  reactions: Record<string, string[]>; // emoji -> array of userIds
  isPinned?: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
}

export interface User {
  id: string;
  name: string;
  bengaliName: string;
  avatar: string;
  status: 'online' | 'offline' | 'typing';
  lastSeen?: string;
  bio: string;
  phone?: string;
  isBlocked?: boolean;
  role?: 'admin' | 'user';
  createdAt?: number;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  type: 'info' | 'warning' | 'alert' | 'celebration';
  active: boolean;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name: string;
  avatar: string;
  participants: string[]; // userIds
  lastMessage?: {
    text: string;
    timestamp: number;
    senderName: string;
    senderId: string;
  };
  unreadCount: number;
  isPinned?: boolean;
  isArchived?: boolean;
  typingUsers?: string[]; // userIds currently typing
  groupDescription?: string;
  createdTime?: number;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl?: string;
  text?: string;
  backgroundColor?: string;
  timestamp: number;
  viewed?: boolean;
}

export type ThemeMode = 'dark' | 'light' | 'emerald';
export type Language = 'bn' | 'en';
