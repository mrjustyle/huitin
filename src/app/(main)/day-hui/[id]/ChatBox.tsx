'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { IconError } from '@/components/ui/Icons';
import styles from './ChatBox.module.css';

type Message = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_profiles?: { full_name: string };
};

type ChatBoxProps = {
  groupId: string;
  currentUserId: string;
  groupName: string;
  privacyMode?: boolean;
  isOwner?: boolean;
  ownerUserId?: string;
};

export default function ChatBox({ groupId, currentUserId, groupName, privacyMode = false, isOwner = false, ownerUserId }: ChatBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Privacy helper: get display name for a message sender
  const getDisplayName = (msg: Message) => {
    const realName = msg.user_profiles?.full_name || 'Ẩn danh';
    if (!privacyMode || isOwner) return realName;
    if (msg.user_id === currentUserId) return realName;
    if (msg.user_id === ownerUserId) return realName;
    return 'Thành viên ẩn danh';
  };

  useEffect(() => {
    if (!isOpen) return;

    // 1. Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id, user_id, content, created_at
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (!error && data) {
        // We need to fetch profiles manually since we didn't join it (user_profiles is tied to auth.users in our schema, but let's see if we can join it)
        // Actually, user_profiles has `id` matching `auth.users.id`.
        const userIds = [...new Set(data.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', userIds);
          
        const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name]));
        
        const mappedData = data.map(m => ({
          ...m,
          user_profiles: { full_name: profileMap[m.user_id] || 'Ẩn danh' }
        }));
        setMessages(mappedData);
        scrollToBottom();
      }
    };

    fetchMessages();

    // 2. Subscribe to realtime inserts
    const channel = supabase
      .channel(`chat_messages:group_id=eq.${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          // Fetch profile for new message
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('id', newMsg.user_id)
            .single();
            
          newMsg.user_profiles = { full_name: profile?.full_name || 'Ẩn danh' };
          
          setMessages((prev) => [...prev, newMsg]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, isOpen, supabase]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    const { error } = await supabase.from('chat_messages').insert({
      group_id: groupId,
      user_id: currentUserId,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage('');
      scrollToBottom();
    } else {
      console.error('Error sending message:', error);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button 
          className={styles.floatingButton} 
          onClick={() => setIsOpen(true)}
        >
          Chat
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <h3>Phòng Chat: {groupName}</h3>
            <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
              <IconError size={20} />
            </button>
          </div>
          
          <div className={styles.messageList}>
            {messages.length === 0 ? (
              <div className={styles.emptyMsg}>Chưa có tin nhắn nào. Bắt đầu trò chuyện!</div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.user_id === currentUserId;
                return (
                  <div key={msg.id} className={`${styles.messageWrapper} ${isMe ? styles.myMessage : styles.theirMessage}`}>
                    {!isMe && <div className={styles.senderName}>{getDisplayName(msg)}</div>}
                    <div className={styles.messageBubble}>
                      {msg.content}
                    </div>
                    <div className={styles.messageTime}>
                      {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className={styles.inputArea}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              disabled={loading}
              className={styles.input}
            />
            <button type="submit" disabled={!newMessage.trim() || loading} className={styles.sendBtn}>
              Gửi
            </button>
          </form>
        </div>
      )}
    </>
  );
}

