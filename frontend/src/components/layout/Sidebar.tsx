'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface SidebarProps {
    className?: string;
}

const navItems = [
    { label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { label: 'Önerilerim', icon: '💡', path: '/suggestions' },
    { label: 'Yeni Öneri', icon: '✨', path: '/suggestions/new' },
];

export const Sidebar: React.FC<SidebarProps> = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
        } catch {
            router.push('/login');
        }
    };

    const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

    return (
        <aside style={{
            width: '260px',
            background: 'linear-gradient(180deg, #0f172a 0%, #1e3a5f 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 50,
        }}>
            {/* Logo */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        fontWeight: '800',
                        color: 'white',
                    }}>
                        O5
                    </div>
                    <div>
                        <div style={{ fontWeight: '700', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>OpEx 5.0</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Öneri Yönetim Sistemi</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '1rem 0.75rem' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', padding: '0.5rem 0.75rem', marginBottom: '0.25rem' }}>
                    Ana Menü
                </div>
                {navItems.map((item) => {
                    const active = isActive(item.path) && (item.path !== '/suggestions' || pathname === '/suggestions'); // Simple logic, can be improved
                    // Better logic: exact match for root, startsWith for others
                    const isItemActive = item.path === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.path);

                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.7rem 0.75rem',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: isItemActive ? '600' : '400',
                                color: isItemActive ? 'white' : 'rgba(255,255,255,0.65)',
                                backgroundColor: isItemActive ? 'rgba(59,130,246,0.25)' : 'transparent',
                                marginBottom: '0.15rem',
                                textAlign: 'left',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                if (!isItemActive) {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                                    e.currentTarget.style.color = 'white';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isItemActive) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                                }
                            }}
                        >
                            <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                            {item.label}
                        </button>
                    );
                })}

                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', padding: '0.5rem 0.75rem', marginTop: '1.5rem', marginBottom: '0.25rem' }}>
                    Hesap
                </div>
                <button
                    onClick={() => router.push('/change-password')}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.7rem 0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)', backgroundColor: 'transparent',
                        textAlign: 'left', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
                >
                    <span style={{ fontSize: '1.1rem' }}>🔑</span>
                    Şifre Değiştir
                </button>
            </nav>

            {/* User Info */}
            <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.06)',
                }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', fontWeight: '700', color: 'white',
                    }}>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.firstName} {user?.lastName}
                        </div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{user?.employeeId}</div>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Çıkış Yap"
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '1rem', opacity: 0.5, padding: '4px',
                            transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}
                    >
                        🚪
                    </button>
                </div>
            </div>
        </aside>
    );
};