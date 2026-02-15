'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function Header() {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            USER: 'Kullanici',
            ADMIN: 'Yönetici',
            COMMITTEE_MANAGER: 'Komite Baskani',
            COMMITTEE_MEMBER: 'Komite Üyesi',
            APPROVER: 'Onayci',
            PROJECT_LEADER: 'Proje Lideri',
        };
        return labels[role] || role;
    };

    const getInitials = () => {
        if (!user) return '?';
        return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    };

    return (
        <header className="header">
            <div className="header-left">
                <button className="mobile-menu-btn">
                    <i className="bi bi-list" />
                </button>
                <div className="header-search">
                    <i className="bi bi-search" />
                    <input type="text" placeholder="Ara..." />
                </div>
            </div>

            <div className="header-right">
                {/* Notifications */}
                <div className="header-notifications" ref={notificationRef}>
                    <button
                        className="notification-btn"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <i className="bi bi-bell" />
                        <span className="notification-badge">3</span>
                    </button>

                    {showNotifications && (
                        <div className="notification-dropdown">
                            <div className="notification-header">
                                <span>Bildirimler</span>
                                <button className="mark-all-read">Tümünü Oku</button>
                            </div>
                            <div className="notification-list">
                                <div className="notification-item unread">
                                    <div className="notification-icon">
                                        <i className="bi bi-check-circle" />
                                    </div>
                                    <div className="notification-content">
                                        <p>Öneriniz onaylandi</p>
                                        <span>5 dakika önce</span>
                                    </div>
                                </div>
                                <div className="notification-item unread">
                                    <div className="notification-icon">
                                        <i className="bi bi-people" />
                                    </div>
                                    <div className="notification-content">
                                        <p>Komite degerlendirmesi bekleniyor</p>
                                        <span>1 saat önce</span>
                                    </div>
                                </div>
                                <div className="notification-item">
                                    <div className="notification-icon">
                                        <i className="bi bi-kanban" />
                                    </div>
                                    <div className="notification-content">
                                        <p>Proje atamasi yapildi</p>
                                        <span>2 saat önce</span>
                                    </div>
                                </div>
                            </div>
                            <Link href="/notifications" className="notification-footer">
                                Tüm Bildirimler
                            </Link>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div className="header-user" ref={userMenuRef}>
                    <button
                        className="user-btn"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <div className="user-avatar">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.firstName} />
                            ) : (
                                <span>{getInitials()}</span>
                            )}
                        </div>
                        <div className="user-info">
                            <span className="user-name">
                                {user?.firstName} {user?.lastName}
                            </span>
                            <span className="user-role">{getRoleLabel(user?.role || '')}</span>
                        </div>
                        <i className={`bi bi-chevron-${showUserMenu ? 'up' : 'down'}`} />
                    </button>

                    {showUserMenu && (
                        <div className="user-dropdown">
                            <Link href="/profile" className="dropdown-item">
                                <i className="bi bi-person" />
                                <span>Profilim</span>
                            </Link>
                            <Link href="/profile/settings" className="dropdown-item">
                                <i className="bi bi-gear" />
                                <span>Ayarlar</span>
                            </Link>
                            <hr />
                            <button onClick={handleLogout} className="dropdown-item logout">
                                <i className="bi bi-box-arrow-right" />
                                <span>Çikis Yap</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}