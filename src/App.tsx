import React, { useState, useEffect, useCallback } from 'react';
import { 
  Chat, 
  Message, 
  User, 
  Story, 
  Language, 
  ThemeMode, 
  Attachment 
} from './types';
import { 
  INITIAL_USERS, 
  INITIAL_CHATS, 
  INITIAL_MESSAGES, 
  INITIAL_STORIES, 
  getStoredData, 
  setStoredData, 
  broadcastChannel 
} from './utils/storage';
import { soundManager } from './utils/sound';
import { getRandomSimulatedResponse } from './utils/helpers';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ChatInfoDrawer } from './components/ChatInfoDrawer';
import { UserProfileModal } from './components/UserProfileModal';
import { NewChatModal } from './components/NewChatModal';
import { StoryViewerModal } from './components/StoryViewerModal';
import { CallModal } from './components/CallModal';

export default function App() {
  // 1. Core States
  const [users, setUsers] = useState<User[]>(() => 
    getStoredData('users', INITIAL_USERS)
  );

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = getStoredData('current_user_id', 'user-me');
    return INITIAL_USERS.find(u => u.id === saved) || INITIAL_USERS[0];
  });

  const [chats, setChats] = useState<Chat[]>(() => 
    getStoredData('chats', INITIAL_CHATS)
  );

  const [messages, setMessages] = useState<Record<string, Message[]>>(() => 
    getStoredData('messages', INITIAL_MESSAGES)
  );

  const [stories, setStories] = useState<Story[]>(() => 
    getStoredData('stories', INITIAL_STORIES)
  );

  const [activeChatId, setActiveChatId] = useState<string | null>('chat-tamim');

  // App Settings
  const [theme, setTheme] = useState<ThemeMode>(() => 
    getStoredData('theme', 'dark')
  );
  const [lang, setLang] = useState<Language>(() => 
    getStoredData('lang', 'bn')
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isAutoReplyEnabled, setIsAutoReplyEnabled] = useState<boolean>(true);

  // Modals & Drawers
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [activeCall, setActiveCall] = useState<{
    contactName: string;
    contactAvatar: string;
    type: 'audio' | 'video';
  } | null>(null);

  // Mobile View state
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    setStoredData('users', users);
  }, [users]);

  useEffect(() => {
    setStoredData('current_user_id', currentUser.id);
  }, [currentUser]);

  useEffect(() => {
    setStoredData('chats', chats);
  }, [chats]);

  useEffect(() => {
    setStoredData('messages', messages);
  }, [messages]);

  useEffect(() => {
    setStoredData('stories', stories);
  }, [stories]);

  useEffect(() => {
    setStoredData('theme', theme);
  }, [theme]);

  useEffect(() => {
    setStoredData('lang', lang);
  }, [lang]);

  // Sync with BroadcastChannel for live multi-tab communication
  useEffect(() => {
    const channel = broadcastChannel;
    if (!channel) return;

    const handleMessage = (e: MessageEvent) => {
      const { type, payload } = e.data || {};
      if (type === 'NEW_MESSAGE') {
        const { chatId, message } = payload;
        setMessages(prev => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), message]
        }));
        setChats(prev => prev.map(c => {
          if (c.id === chatId) {
            return {
              ...c,
              lastMessage: {
                text: message.text,
                timestamp: message.timestamp,
                senderName: message.senderName,
                senderId: message.senderId
              },
              unreadCount: message.senderId !== currentUser.id ? c.unreadCount + 1 : c.unreadCount
            };
          }
          return c;
        }));
        if (message.senderId !== currentUser.id) {
          soundManager.playReceived();
        }
      } else if (type === 'REACTION_UPDATE') {
        const { chatId, messageId, reactions } = payload;
        setMessages(prev => ({
          ...prev,
          [chatId]: (prev[chatId] || []).map(m => 
            m.id === messageId ? { ...m, reactions } : m
          )
        }));
      }
    };

    channel.addEventListener('message', handleMessage);
    return () => {
      channel.removeEventListener('message', handleMessage);
    };
  }, [currentUser.id]);

  // Handle active chat selection
  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setMobileShowChat(true);

    // Reset unread count
    setChats(prev => prev.map(c => 
      c.id === chatId ? { ...c, unreadCount: 0 } : c
    ));
  };

  // Send message handler
  const handleSendMessage = useCallback((text: string, attachments?: Attachment[], replyTo?: Message) => {
    if (!activeChatId) return;

    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) return;

    const newMsgId = `msg-${Date.now()}`;
    const newMsg: Message = {
      id: newMsgId,
      chatId: activeChatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text,
      timestamp: Date.now(),
      status: 'sent',
      replyTo: replyTo ? {
        id: replyTo.id,
        senderName: replyTo.senderName,
        text: replyTo.text
      } : undefined,
      attachments,
      reactions: {}
    };

    // Play sound
    soundManager.playSent();

    // Update messages
    setMessages(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMsg]
    }));

    // Update last message in chat
    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          lastMessage: {
            text: text || (attachments ? (lang === 'bn' ? 'ফাইল/ছবি' : 'Attachment') : ''),
            timestamp: newMsg.timestamp,
            senderName: currentUser.name,
            senderId: currentUser.id
          }
        };
      }
      return c;
    }));

    // Broadcast to other tabs
    broadcastChannel?.postMessage({
      type: 'NEW_MESSAGE',
      payload: { chatId: activeChatId, message: newMsg }
    });

    // Mark as delivered shortly
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [activeChatId]: (prev[activeChatId] || []).map(m => 
          m.id === newMsgId ? { ...m, status: 'delivered' as const } : m
        )
      }));
    }, 700);

    // Auto-Reply simulation
    if (isAutoReplyEnabled) {
      // Find a respondent (first other participant)
      const otherParticipantId = activeChat.participants.find(p => p !== currentUser.id);
      const respondent = users.find(u => u.id === otherParticipantId) || users[1];

      // Step 1: Start typing after 1 second
      setTimeout(() => {
        setChats(prev => prev.map(c => 
          c.id === activeChatId ? { ...c, typingUsers: [respondent.id] } : c
        ));
      }, 1000);

      // Step 2: Send simulated reply after 2.5 seconds
      setTimeout(() => {
        const replyText = getRandomSimulatedResponse();
        const replyMsgId = `msg-reply-${Date.now()}`;
        const replyMsg: Message = {
          id: replyMsgId,
          chatId: activeChatId,
          senderId: respondent.id,
          senderName: respondent.name,
          senderAvatar: respondent.avatar,
          text: replyText,
          timestamp: Date.now(),
          status: 'read',
          reactions: {}
        };

        // Stop typing
        setChats(prev => prev.map(c => {
          if (c.id === activeChatId) {
            return {
              ...c,
              typingUsers: [],
              lastMessage: {
                text: replyText,
                timestamp: replyMsg.timestamp,
                senderName: respondent.name,
                senderId: respondent.id
              }
            };
          }
          return c;
        }));

        // Add reply message & mark user's message as read
        setMessages(prev => ({
          ...prev,
          [activeChatId]: (prev[activeChatId] || []).map(m => 
            m.id === newMsgId ? { ...m, status: 'read' as const } : m
          ).concat(replyMsg)
        }));

        soundManager.playReceived();

        // Broadcast to other tabs
        broadcastChannel?.postMessage({
          type: 'NEW_MESSAGE',
          payload: { chatId: activeChatId, message: replyMsg }
        });
      }, 2600);
    }
  }, [activeChatId, chats, currentUser, isAutoReplyEnabled, lang, users]);

  // Instant simulate reply trigger
  const handleSimulateReplyNow = useCallback(() => {
    if (!activeChatId) return;
    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) return;

    const otherParticipantId = activeChat.participants.find(p => p !== currentUser.id);
    const respondent = users.find(u => u.id === otherParticipantId) || users[1];

    const replyText = getRandomSimulatedResponse();
    const replyMsgId = `msg-reply-${Date.now()}`;
    const replyMsg: Message = {
      id: replyMsgId,
      chatId: activeChatId,
      senderId: respondent.id,
      senderName: respondent.name,
      senderAvatar: respondent.avatar,
      text: replyText,
      timestamp: Date.now(),
      status: 'read',
      reactions: {}
    };

    setMessages(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), replyMsg]
    }));

    setChats(prev => prev.map(c => 
      c.id === activeChatId 
        ? { 
            ...c, 
            lastMessage: {
              text: replyText,
              timestamp: replyMsg.timestamp,
              senderName: respondent.name,
              senderId: respondent.id
            } 
          } 
        : c
    ));

    soundManager.playReceived();
  }, [activeChatId, chats, currentUser.id, users]);

  // Message reaction handler
  const handleReactMessage = useCallback((messageId: string, emoji: string) => {
    if (!activeChatId) return;

    setMessages(prev => {
      const chatMsgs = prev[activeChatId] || [];
      const updated = chatMsgs.map(m => {
        if (m.id !== messageId) return m;

        const reactions = { ...(m.reactions || {}) };
        const usersList = [...(reactions[emoji] || [])];
        const userIndex = usersList.indexOf(currentUser.id);

        if (userIndex > -1) {
          usersList.splice(userIndex, 1);
        } else {
          usersList.push(currentUser.id);
        }

        if (usersList.length > 0) {
          reactions[emoji] = usersList;
        } else {
          delete reactions[emoji];
        }

        broadcastChannel?.postMessage({
          type: 'REACTION_UPDATE',
          payload: { chatId: activeChatId, messageId, reactions }
        });

        return { ...m, reactions };
      });

      return { ...prev, [activeChatId]: updated };
    });
  }, [activeChatId, currentUser.id]);

  // Delete message handler
  const handleDeleteMessage = useCallback((messageId: string) => {
    if (!activeChatId) return;

    setMessages(prev => ({
      ...prev,
      [activeChatId]: (prev[activeChatId] || []).map(m => 
        m.id === messageId ? { ...m, isDeleted: true, text: '', attachments: [] } : m
      )
    }));
  }, [activeChatId]);

  // Toggle pin message handler
  const handleTogglePinMessage = useCallback((messageId: string) => {
    if (!activeChatId) return;

    setMessages(prev => ({
      ...prev,
      [activeChatId]: (prev[activeChatId] || []).map(m => 
        m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
      )
    }));
  }, [activeChatId]);

  // Create Direct Chat
  const handleCreateDirectChat = (targetUser: User) => {
    const existing = chats.find(c => 
      c.type === 'direct' && c.participants.includes(targetUser.id) && c.participants.includes(currentUser.id)
    );

    if (existing) {
      handleSelectChat(existing.id);
      return;
    }

    const newChat: Chat = {
      id: `chat-direct-${targetUser.id}`,
      type: 'direct',
      name: targetUser.name,
      avatar: targetUser.avatar,
      participants: [currentUser.id, targetUser.id],
      unreadCount: 0,
      lastMessage: undefined
    };

    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setMobileShowChat(true);
  };

  // Create Group Chat
  const handleCreateGroupChat = (name: string, participantIds: string[], description?: string, avatar?: string) => {
    const newChat: Chat = {
      id: `chat-group-${Date.now()}`,
      type: 'group',
      name,
      avatar: avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&h=200&q=80',
      participants: participantIds,
      unreadCount: 0,
      groupDescription: description,
      createdTime: Date.now()
    };

    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setMobileShowChat(true);

    // Initial welcome message in group
    const welcomeMsg: Message = {
      id: `msg-${Date.now()}`,
      chatId: newChat.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: lang === 'bn' 
        ? `🎉 "${name}" গ্রুপ তৈরি করা হয়েছে! সবাইকে স্বাগতম!` 
        : `🎉 Created "${name}" group! Welcome everyone!`,
      timestamp: Date.now(),
      status: 'read',
      reactions: { '🎉': [currentUser.id] }
    };

    setMessages(prev => ({
      ...prev,
      [newChat.id]: [welcomeMsg]
    }));
  };

  // Add new user to user list
  const handleAddNewUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  // Reply to story
  const handleReplyToStory = (story: Story, replyText: string) => {
    const targetUser = users.find(u => u.id === story.userId);
    if (!targetUser) return;

    handleCreateDirectChat(targetUser);
    setTimeout(() => {
      handleSendMessage(`[স্টোরির উত্তর / Story Reply]: ${replyText}`);
    }, 300);
  };

  // Start call
  const handleStartCall = (type: 'audio' | 'video') => {
    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) return;

    setActiveCall({
      contactName: activeChat.name,
      contactAvatar: activeChat.avatar,
      type
    });
  };

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const activeChatMessages = activeChat ? (messages[activeChat.id] || []) : [];

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col ${
      theme === 'light' 
        ? 'bg-slate-100 text-slate-800' 
        : theme === 'emerald'
        ? 'bg-emerald-950 text-slate-100'
        : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Main Container Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Chat list, stories, settings) */}
        <div className={`w-full md:w-80 lg:w-96 shrink-0 h-full ${
          mobileShowChat ? 'hidden md:flex' : 'flex'
        }`}>
          <Sidebar
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
            currentUser={currentUser}
            stories={stories}
            onOpenStory={(idx) => setActiveStoryIndex(idx)}
            onOpenNewChatModal={() => setIsNewChatModalOpen(true)}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
            lang={lang}
            onToggleLang={() => setLang(l => l === 'bn' ? 'en' : 'bn')}
            theme={theme}
            onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            soundEnabled={soundEnabled}
            onToggleSound={() => {
              const nextState = !soundEnabled;
              setSoundEnabled(nextState);
              soundManager.soundEnabled = nextState;
            }}
          />
        </div>

        {/* Center Chat Area */}
        <div className={`flex-1 h-full flex flex-col ${
          !mobileShowChat ? 'hidden md:flex' : 'flex'
        }`}>
          {activeChat ? (
            <div className="flex-1 flex h-full overflow-hidden">
              <ChatArea
                chat={activeChat}
                currentUser={currentUser}
                allUsers={users}
                messages={activeChatMessages}
                onSendMessage={handleSendMessage}
                onReactMessage={handleReactMessage}
                onDeleteMessage={handleDeleteMessage}
                onTogglePinMessage={handleTogglePinMessage}
                onStartCall={handleStartCall}
                onToggleInfoDrawer={() => setIsInfoDrawerOpen(!isInfoDrawerOpen)}
                onBackToSidebar={() => setMobileShowChat(false)}
                isAutoReplyEnabled={isAutoReplyEnabled}
                onToggleAutoReply={() => setIsAutoReplyEnabled(!isAutoReplyEnabled)}
                onSimulateReplyNow={handleSimulateReplyNow}
                lang={lang}
              />

              {/* Right Info Drawer (Desktop & toggleable) */}
              {isInfoDrawerOpen && (
                <ChatInfoDrawer
                  chat={activeChat}
                  allUsers={users}
                  messages={activeChatMessages}
                  onClose={() => setIsInfoDrawerOpen(false)}
                  lang={lang}
                />
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              {lang === 'bn' ? 'একটি চ্যাট নির্বাচন করুন' : 'Select a conversation to start chatting'}
            </div>
          )}
        </div>
      </div>

      {/* User Switcher / Profile Modal */}
      {isProfileModalOpen && (
        <UserProfileModal
          currentUser={currentUser}
          allUsers={users}
          onSelectUser={(u) => setCurrentUser(u)}
          onUpdateCurrentUser={(u) => {
            setUsers(prev => prev.map(old => old.id === u.id ? u : old));
            setCurrentUser(u);
          }}
          onClose={() => setIsProfileModalOpen(false)}
          lang={lang}
        />
      )}

      {/* New Chat & New Group Modal */}
      {isNewChatModalOpen && (
        <NewChatModal
          currentUser={currentUser}
          allUsers={users}
          existingChats={chats}
          onCreateDirectChat={handleCreateDirectChat}
          onCreateGroupChat={handleCreateGroupChat}
          onAddNewUser={handleAddNewUser}
          onClose={() => setIsNewChatModalOpen(false)}
          lang={lang}
        />
      )}

      {/* Stories / Status Updates Modal */}
      {activeStoryIndex !== null && (
        <StoryViewerModal
          stories={stories}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
          onReply={handleReplyToStory}
          lang={lang}
        />
      )}

      {/* Audio / Video Call Simulation Modal */}
      {activeCall && (
        <CallModal
          contactName={activeCall.contactName}
          contactAvatar={activeCall.contactAvatar}
          callType={activeCall.type}
          onClose={() => setActiveCall(null)}
          lang={lang}
        />
      )}
    </div>
  );
}
