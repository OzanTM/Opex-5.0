'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface Notification {
    id: number;
    uuid: string;
    type: string;
    title: string;
    message: string;
    data: string | null;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
}

const typeConfig: Record<string, { icon: string; color: string }> = {
    SUGGESTION_SUBMITTED: { icon: 'bi-lightbulb', color: '#3b82f6' },
    SUGGESTION_APPROVED: { icon: 'bi-check-circle', color: '#10b981' },
    SUGGESTION_REJECTED: { icon: 'bi-x-circle', color: '#ef4444' },
    APPROVAL_REQUEST: { icon: 'bi-clipboard-check', color: '#8b5cf6' },
    COMMITTEE_REVIEW: { icon: 'bi-people', color: '#f59e0b' },
    PROJECT_ASSIGNED: { icon: 'bi-kanban', color: '#0ea5e9' },
    PROJECT_COMPLETED: { icon: 'bi-trophy', color: '#10b981' },
    SYSTEM: { icon: 'bi-gear', color: '#64748b' },
};

export default function NotificationsPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        fetchNotifications();
    }, [isAuthenticated, router]);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/users/me/notifications');
            setNotifications(response.data.data?.notifications || []);
            setUnreadCount(response.data.data?.unreadCount || 0);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await api.patch(`/users/me/notifications/${id}/read`);
            setNotifications(
                notifications.map((n) =>
                    n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
                )
            );
            setUnreadCount(Math.max(0, unreadCount - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/users/me/notifications/read-all');
            setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const deleteNotification = async (id: number) => {
        try {
            await api.delete(`/users/me/notifications/${id}`);
            setNotifications(notifications.filter((n) => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const getTimeAgo = (date: string) => {
        const now = new Date();
        const then = new Date(date);
        const diff = now.getTime() - then.getTime();

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Simdi';
        if (minutes < 60) return `${minutes} dakika önce`;
        if (hours < 24) return `${hours} saat önce`;
        if (days < 7) return `${days} gün önce`;
        return then.toLocaleDateString('tr-TR');
    };

    const filteredNotifications = notifications.filter((n) => {
        if (filter === 'unread') return !n.isRead;
        return true;
    });

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="notifications-page">
            <div className="page-header">
                <div>
                    <h1>Bildirimler</h1>
                    <p>
                        {unreadCount > 0
                            ? `${unreadCount} okunmamis bildiriminiz var`
                            : 'Tüm bildirimler okundu'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button className="btn btn-secondary" onClick={markAllAsRead}>
                        <i className="bi bi-check2-all"></i>
                        Tümünü Oku
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Tümü ({notifications.length})
                </button>
                <button
                    className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
                    onClick={() => setFilter('unread')}
                >
                    Okunmamis ({unreadCount})
                </button>
            </div>

            {/* Notifications List */}
            <div className="notifications-list">
                {filteredNotifications.length === 0 ? (
                    <div className="empty-state">
                        <i className="bi bi-bell-slash"></i>
                        <h3>Bildirim Bulunamadi</h3>
                        <p>
                            {filter === 'unread'
                                ? 'Okunmamis bildiriminiz yok'
                                : 'Henüz bildiriminiz yok'}
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => {
                        const config = typeConfig[notification.type] || typeConfig.SYSTEM;
                        return (
                            <div
                                key={notification.id}
                                className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
                            >
                                <div
                                    className="notification-icon"
                                    style={{ background: `${config.color}20`, color: config.color }}
                                >
                                    <i className={`bi ${config.icon}`}></i>
                                </div>
                                <div className="notification-content">
                                    <div className="notification-header">
                                        <h4>{notification.title}</h4>
                                        <span className="notification-time">
                                            {getTimeAgo(notification.createdAt)}
                                        </span>
                                    </div>
                                    <p>{notification.message}</p>
                                    {notification.data && (
                                        <Link href={JSON.parse(notification.data).link || '#'} className="notification-link">
                                            Detaylari Gör
                                        </Link>
                                    )}
                                </div>
                                <div className="notification-actions">
                                    {!notification.isRead && (
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => markAsRead(notification.id)}
                                            title="Okundu isaretle"
                                        >
                                            <i className="bi bi-check"></i>
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => deleteNotification(notification.id)}
                                        title="Sil"
                                    >
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}