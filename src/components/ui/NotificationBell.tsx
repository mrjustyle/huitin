'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { IconNotification, IconPayment, IconConfirmed, IconSuccess, IconPayout, IconInfo } from '@/components/ui/Icons';
import styles from './NotificationBell.module.css';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
  actor_id?: string | null;
  actor?: {
    avatar_url: string | null;
    full_name: string | null;
  } | null;
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastNotif, setToastNotif] = useState<Notification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();

    // Close on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Set up realtime subscription with a unique channel name to avoid "already subscribed" errors on re-render
    const channel = supabase
      .channel(`notifications-${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        async (payload) => {
          await fetchNotifications();
          
          // Get the newly inserted notification to show in toast
          const newNotif = payload.new as Notification;
          const { data: { user } } = await supabase.auth.getUser();
          if (user && newNotif.user_id === user.id) {
            setToastNotif(newNotif);
            setTimeout(() => {
              setToastNotif(null);
            }, 5000); // Auto hide after 5 seconds
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*, actor:user_profiles!actor_id(avatar_url, full_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <>
      <div className={styles.bellContainer} ref={dropdownRef}>
        <button 
          className={styles.bellButton} 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Thông báo"
        >
          <IconNotification size={20} />
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        {isOpen && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownHeader}>
              <h3 className={styles.dropdownTitle}>Thông báo</h3>
              {unreadCount > 0 && (
                <button className={styles.markAllRead} onClick={markAllAsRead}>
                  Đánh dấu đã đọc
                </button>
              )}
            </div>
            
            <div className={styles.notificationsList}>
              {notifications.length === 0 ? (
                <div className={styles.emptyState}>Chưa có thông báo nào</div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`${styles.notificationItem} ${!notif.is_read ? styles.unread : ''}`}
                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                  >
                    {notif.actor ? (
                      notif.actor.avatar_url ? (
                        <img src={notif.actor.avatar_url} alt="Avatar" className={styles.avatarIcon} />
                      ) : (
                        <div className={styles.initialsIcon}>
                          {notif.actor.full_name ? notif.actor.full_name.charAt(0).toUpperCase() : '?'}
                        </div>
                      )
                    ) : (
                      <div className={styles.notifIcon}>
                        {notif.type === 'payment_due' && <IconPayment size={20} />}
                        {notif.type === 'payment_confirmed' && <IconConfirmed size={20} />}
                        {notif.type === 'auction_won' && <IconSuccess size={20} />}
                        {notif.type === 'payout_received' && <IconPayout size={20} />}
                        {notif.type === 'info' && <IconInfo size={20} />}
                      </div>
                    )}
                    <div className={styles.notifContent}>
                      {notif.link ? (
                        <Link href={notif.link} className={styles.notifTitle} onClick={() => setIsOpen(false)}>
                          {notif.title}
                        </Link>
                      ) : (
                        <h4 className={styles.notifTitle}>{notif.title}</h4>
                      )}
                      <p className={styles.notifMessage}>{notif.message}</p>
                      <span className={styles.notifTime}>
                        {timeAgo(notif.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Popup Toast */}
      {toastNotif && (
        <div className={styles.toastContainer}>
          <div className={styles.toastHeader}>
            <span>Thông báo mới</span>
            <button className={styles.toastClose} onClick={() => setToastNotif(null)}>✕</button>
          </div>
          <div 
            className={styles.toastBody}
            onClick={() => {
              setIsOpen(true);
              setToastNotif(null);
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.notificationItem} style={{ border: 'none', padding: 0 }}>
              <div className={styles.notifIcon}>
                {toastNotif.type === 'payment_due' && <IconPayment size={20} />}
                {toastNotif.type === 'payment_confirmed' && <IconConfirmed size={20} />}
                {toastNotif.type === 'auction_won' && <IconSuccess size={20} />}
                {toastNotif.type === 'payout_received' && <IconPayout size={20} />}
                {toastNotif.type === 'info' && <IconInfo size={20} />}
              </div>
              <div className={styles.notifContent}>
                <h4 className={styles.notifTitle}>{toastNotif.title}</h4>
                <p className={styles.notifMessage}>{toastNotif.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
