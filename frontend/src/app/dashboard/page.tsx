'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { suggestionsApi, approvalsApi } from '@/lib/api';
import { Suggestion, getStatusLabelTr, APPROVAL_STEP_TYPE_LABELS } from '@/types';

const statusConfig: Record<string, { color: string; bg: string; icon: string }> = {
    DRAFT: { color: '#6b7280', bg: '#f3f4f6', icon: '📝' },
    PENDING_COMMITTEE_REVIEW: { color: '#d97706', bg: '#fef3c7', icon: '⏳' },
    COMMITTEE_REVISION_REQUESTED: { color: '#ea580c', bg: '#ffedd5', icon: '🔄' },
    COMMITTEE_REJECTED: { color: '#dc2626', bg: '#fee2e2', icon: '❌' },
    PENDING_APPROVAL: { color: '#7c3aed', bg: '#ede9fe', icon: '📋' },
    APPROVER_REJECTED: { color: '#dc2626', bg: '#fee2e2', icon: '❌' },
    APPROVED: { color: '#059669', bg: '#d1fae5', icon: '✅' },
    IN_PROGRESS: { color: '#2563eb', bg: '#dbeafe', icon: '🚀' },
    COMPLETED: { color: '#059669', bg: '#d1fae5', icon: '🎉' },
    CANCELLED: { color: '#6b7280', bg: '#f3f4f6', icon: '🚫' },
};

const navItems = [
    { label: 'Dashboard', icon: '📊', path: '/dashboard', active: true },
    { label: 'Önerilerim', icon: '💡', path: '/suggestions' },
    { label: 'Yeni Öneri', icon: '✨', path: '/suggestions/new' },
];

interface PendingApprovalItem {
    id: number;
    stepNumber: number;
    stepType: string;
    createdAt: string;
    suggestion: {
        id: number;
        referenceNumber: string;
        title: string;
        owner?: {
            firstName: string;
            lastName: string;
        };
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, logout } = useAuthStore();
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalItem[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated && !isLoading) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSuggestions();
        }
    }, [isAuthenticated]);

    const isCommitteeManager = user?.role === 'COMMITTEE_MANAGER' || user?.role === 'ADMIN';

    const fetchSuggestions = async () => {
        try {
            setDataLoading(true);
            const [suggestionResponse, pendingApprovalResponse] = await Promise.all([
                (isCommitteeManager || user?.role === 'APPROVER')
                    ? suggestionsApi.getAll()
                    : suggestionsApi.getMy(),
                approvalsApi.getPending(),
            ]);

            const suggestionData: any = (suggestionResponse as any)?.data || suggestionResponse || [];
            const suggestionItems = Array.isArray(suggestionData) ? suggestionData : suggestionData.data || [];
            setSuggestions(suggestionItems);

            const pendingData: any = (pendingApprovalResponse as any)?.data || pendingApprovalResponse || [];
            const pendingItems = Array.isArray(pendingData) ? pendingData : pendingData.data || [];
            setPendingApprovals(pendingItems);
        } catch (error) {
            console.error('Failed to fetch suggestions:', error);
            setPendingApprovals([]);
        } finally {
            setDataLoading(false);
        }
    };

    if (isLoading || !isAuthenticated) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '3rem', height: '3rem', border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid #60a5fa', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }}></div>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Yükleniyor...</p>
                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    // Compute stats
    const totalSuggestions = suggestions.length;
    const draftCount = suggestions.filter(s => s.status === 'DRAFT').length;
    const pendingCount = suggestions.filter(s => ['PENDING_COMMITTEE_REVIEW', 'PENDING_APPROVAL', 'COMMITTEE_REVISION_REQUESTED'].includes(s.status)).length;
    const approvedCount = suggestions.filter(s => ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(s.status)).length;
    const rejectedCount = suggestions.filter(s => ['COMMITTEE_REJECTED', 'APPROVER_REJECTED'].includes(s.status)).length;
    const totalSavings = suggestions.reduce((sum, s) => sum + (s.estimatedSavings || 0), 0);
    const totalCost = suggestions.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);

    // Status distribution for chart
    const statusDistribution = suggestions.reduce((acc: Record<string, number>, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
    }, {});

    // Recent suggestions (latest 5)
    const recentSuggestions = [...suggestions]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 5);

    const formatCurrency = (val: number) => {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M ₺`;
        if (val >= 1000) return `${(val / 1000).toFixed(0)}K ₺`;
        return `${val.toLocaleString('tr-TR')} ₺`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStepTypeLabel = (stepType: string) => {
        const typedKey = stepType as keyof typeof APPROVAL_STEP_TYPE_LABELS;
        if (APPROVAL_STEP_TYPE_LABELS[typedKey]) return APPROVAL_STEP_TYPE_LABELS[typedKey];
        return stepType.replace(/_/g, ' ');
    };

    const getTimeOfDayGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Günaydın';
        if (hour < 18) return 'İyi Günler';
        return 'İyi Akşamlar';
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
        } catch {
            router.push('/login');
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', display: 'flex' }}>
            {/* Sidebar */}
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
                    {navItems.map((item) => (
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
                                fontWeight: item.active ? '600' : '400',
                                color: item.active ? 'white' : 'rgba(255,255,255,0.65)',
                                backgroundColor: item.active ? 'rgba(59,130,246,0.25)' : 'transparent',
                                marginBottom: '0.15rem',
                                textAlign: 'left',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                if (!item.active) {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                                    e.currentTarget.style.color = 'white';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!item.active) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                                }
                            }}
                        >
                            <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}

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

            {/* Main Content */}
            <div style={{ marginLeft: '260px', flex: 1, minHeight: '100vh' }}>
                {/* Top Header */}
                <header style={{
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #7c3aed 100%)',
                    color: 'white',
                    padding: '2rem 2.5rem',
                }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>
                                    {getTimeOfDayGreeting()} — {
                                        user?.role === 'COMMITTEE_MANAGER' ? 'Komite Yöneticisi Paneli' :
                                            user?.role === 'ADMIN' ? 'Yönetici Paneli' :
                                                user?.role === 'APPROVER' ? 'Onay Yöneticisi Paneli' : 'Çalışan Paneli'
                                    }
                                </p>
                                <h1 style={{ margin: '0.25rem 0 0 0', fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
                                    {user?.firstName} {user?.lastName}
                                </h1>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.6 }}>
                                    {user?.department?.name || 'Departman'} • {user?.position || user?.employeeId}
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/suggestions/new')}
                                style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.25)',
                                    color: 'white',
                                    padding: '0.65rem 1.25rem',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                            >
                                ✨ Yeni Öneri Oluştur
                            </button>
                        </div>
                    </div>
                </header>

                {/* Stats Cards */}
                <div style={{ maxWidth: '1200px', margin: '-1.5rem auto 0', padding: '0 2.5rem', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        {/* Total */}
                        <div style={{
                            background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)',
                            transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer',
                        }}
                            onClick={() => router.push('/suggestions')}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Toplam Öneri</p>
                                    <p style={{ margin: '0.35rem 0 0', fontSize: '2rem', fontWeight: '800', color: '#111827', lineHeight: 1 }}>{dataLoading ? '...' : totalSuggestions}</p>
                                </div>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                                    📊
                                </div>
                            </div>
                        </div>

                        {/* Pending */}
                        <div style={{
                            background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)',
                            transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer',
                        }}
                            onClick={() => router.push('/suggestions')}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Onay Bekliyor</p>
                                    <p style={{ margin: '0.35rem 0 0', fontSize: '2rem', fontWeight: '800', color: '#d97706', lineHeight: 1 }}>{dataLoading ? '...' : pendingCount}</p>
                                </div>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                                    ⏳
                                </div>
                            </div>
                        </div>

                        {/* Approved */}
                        <div style={{
                            background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)',
                            transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer',
                        }}
                            onClick={() => router.push('/suggestions')}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Onaylanan</p>
                                    <p style={{ margin: '0.35rem 0 0', fontSize: '2rem', fontWeight: '800', color: '#059669', lineHeight: 1 }}>{dataLoading ? '...' : approvedCount}</p>
                                </div>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                                    ✅
                                </div>
                            </div>
                        </div>

                        {/* Total Savings */}
                        <div style={{
                            background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tahmini Kazanç</p>
                                    <p style={{ margin: '0.35rem 0 0', fontSize: '2rem', fontWeight: '800', color: '#7c3aed', lineHeight: 1 }}>{dataLoading ? '...' : formatCurrency(totalSavings)}</p>
                                </div>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                                    💰
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div style={{ maxWidth: '1200px', margin: '1.5rem auto 0', padding: '0 2.5rem 2.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }}>

                        {/* Left Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Recent Suggestions */}
                            <div style={{
                                background: 'white', borderRadius: '14px',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)',
                                overflow: 'hidden',
                            }}>
                                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#111827' }}>📋 Son Öneriler</h2>
                                    <button
                                        onClick={() => router.push('/suggestions')}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#3b82f6', fontWeight: '600' }}
                                    >
                                        Tümünü Gör →
                                    </button>
                                </div>

                                {dataLoading ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                                        <div style={{ width: '2rem', height: '2rem', border: '3px solid #f3f4f6', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }}></div>
                                        Yükleniyor...
                                    </div>
                                ) : recentSuggestions.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>💡</div>
                                        <p style={{ color: '#6b7280', margin: '0 0 1rem', fontSize: '0.9rem' }}>Henüz öneri bulunmuyor</p>
                                        <button
                                            onClick={() => router.push('/suggestions/new')}
                                            style={{
                                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                                color: 'white', border: 'none', padding: '0.6rem 1.25rem',
                                                borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
                                            }}
                                        >
                                            ✨ İlk Önerinizi Oluşturun
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        {recentSuggestions.map((s, i) => {
                                            const sc = statusConfig[s.status] || statusConfig.DRAFT;
                                            return (
                                                <div
                                                    key={s.id}
                                                    onClick={() => router.push(`/suggestions/${s.id}`)}
                                                    style={{
                                                        padding: '1rem 1.5rem',
                                                        borderBottom: i < recentSuggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.15s',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '1rem',
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                >
                                                    <div style={{
                                                        width: '8px', height: '8px', borderRadius: '50%',
                                                        backgroundColor: sc.color, flexShrink: 0,
                                                    }} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                                            <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {s.title}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                                                            <span style={{ fontFamily: 'monospace' }}>{s.referenceNumber}</span>
                                                            <span>•</span>
                                                            <span>{formatDate(s.createdAt)}</span>
                                                            {s.estimatedSavings ? (
                                                                <>
                                                                    <span>•</span>
                                                                    <span style={{ color: '#059669', fontWeight: '600' }}>
                                                                        💰 {s.estimatedSavings.toLocaleString('tr-TR')} ₺
                                                                    </span>
                                                                </>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    <span style={{
                                                        fontSize: '0.7rem', fontWeight: '600',
                                                        padding: '0.25rem 0.6rem', borderRadius: '6px',
                                                        color: sc.color, backgroundColor: sc.bg,
                                                        whiteSpace: 'nowrap', flexShrink: 0,
                                                    }}>
                                                        {sc.icon} {getStatusLabelTr(s.status)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div style={{
                                background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)',
                            }}>
                                <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: '700', color: '#111827' }}>⚡ Hızlı İşlemler</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                    <button
                                        onClick={() => router.push('/suggestions/new')}
                                        style={{
                                            padding: '1rem', borderRadius: '10px', border: '1px solid #e5e7eb',
                                            background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                                            cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#93c5fd'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                    >
                                        <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>✨</div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1e40af' }}>Yeni Öneri</div>
                                        <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.15rem' }}>Öneri oluştur</div>
                                    </button>
                                    <button
                                        onClick={() => router.push('/suggestions')}
                                        style={{
                                            padding: '1rem', borderRadius: '10px', border: '1px solid #e5e7eb',
                                            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                                            cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#86efac'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                    >
                                        <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>📋</div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#166534' }}>Önerilerim</div>
                                        <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.15rem' }}>Tüm önerileri gör</div>
                                    </button>
                                    <button
                                        onClick={() => router.push('/change-password')}
                                        style={{
                                            padding: '1rem', borderRadius: '10px', border: '1px solid #e5e7eb',
                                            background: 'linear-gradient(135deg, #faf5ff, #ede9fe)',
                                            cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#c4b5fd'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                    >
                                        <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>🔐</div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#5b21b6' }}>Hesap Ayarları</div>
                                        <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.15rem' }}>Şifre değiştir</div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Sidebar */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Status Distribution */}
                            <div style={{
                                background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)',
                            }}>
                                <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: '700', color: '#111827' }}>📈 Durum Dağılımı</h2>

                                {dataLoading ? (
                                    <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af', fontSize: '0.85rem' }}>Yükleniyor...</div>
                                ) : Object.keys(statusDistribution).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af', fontSize: '0.85rem' }}>Veri yok</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                        {Object.entries(statusDistribution).map(([status, count]) => {
                                            const sc = statusConfig[status] || statusConfig.DRAFT;
                                            const pct = totalSuggestions > 0 ? Math.round((count / totalSuggestions) * 100) : 0;
                                            return (
                                                <div key={status}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                                        <span style={{ fontSize: '0.8rem', color: '#4b5563', fontWeight: '500' }}>
                                                            {sc.icon} {getStatusLabelTr(status)}
                                                        </span>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: sc.color }}>{count}</span>
                                                    </div>
                                                    <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
                                                        <div style={{
                                                            height: '100%', borderRadius: '3px',
                                                            backgroundColor: sc.color,
                                                            width: `${pct}%`,
                                                            transition: 'width 0.6s ease-out',
                                                        }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Approval Chain Summary */}
                            <div style={{
                                background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)',
                            }}>
                                <h2 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: '700', color: '#111827' }}>🔗 Onay Zinciri Özeti</h2>
                                <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: '#6b7280' }}>
                                    Size atanmış bekleyen onay adımları
                                </p>

                                {dataLoading ? (
                                    <div style={{ textAlign: 'center', padding: '1.25rem', color: '#9ca3af', fontSize: '0.85rem' }}>Yükleniyor...</div>
                                ) : pendingApprovals.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '1.1rem', color: '#9ca3af', fontSize: '0.82rem', backgroundColor: '#f9fafb', borderRadius: '10px' }}>
                                        Bekleyen onay adımınız yok.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                                        <div style={{ fontSize: '0.76rem', color: '#4b5563', fontWeight: 600 }}>
                                            Toplam: {pendingApprovals.length}
                                        </div>
                                        {pendingApprovals.slice(0, 5).map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => router.push(`/suggestions/${item.suggestion.id}`)}
                                                style={{
                                                    textAlign: 'left',
                                                    border: '1px solid #e5e7eb',
                                                    backgroundColor: '#fff',
                                                    borderRadius: '10px',
                                                    padding: '0.65rem',
                                                    cursor: 'pointer',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                                    <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#1d4ed8' }}>
                                                        {item.stepNumber}. {getStepTypeLabel(item.stepType)}
                                                    </span>
                                                    <span style={{ fontSize: '0.72rem', color: '#6b7280', fontFamily: 'monospace' }}>
                                                        {item.suggestion.referenceNumber}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#111827', fontWeight: 600, marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {item.suggestion.title}
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                                                    <span>
                                                        {(item.suggestion.owner?.firstName && item.suggestion.owner?.lastName)
                                                            ? `${item.suggestion.owner.firstName} ${item.suggestion.owner.lastName}`
                                                            : 'Öneri sahibi'}
                                                    </span>
                                                    <span>{formatDate(item.createdAt)}</span>
                                                </div>
                                            </button>
                                        ))}
                                        {pendingApprovals.length > 5 && (
                                            <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                                                +{pendingApprovals.length - 5} adım daha mevcut.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Financial Summary */}
                            <div style={{
                                background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)',
                            }}>
                                <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: '700', color: '#111827' }}>💰 Finansal Özet</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ padding: '0.75rem', borderRadius: '10px', backgroundColor: '#f0fdf4' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>Tahmini Kazanç</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#059669' }}>
                                            {dataLoading ? '...' : `${totalSavings.toLocaleString('tr-TR')} ₺`}
                                        </div>
                                    </div>
                                    <div style={{ padding: '0.75rem', borderRadius: '10px', backgroundColor: '#fef2f2' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>Tahmini Maliyet</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#dc2626' }}>
                                            {dataLoading ? '...' : `${totalCost.toLocaleString('tr-TR')} ₺`}
                                        </div>
                                    </div>
                                    <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'linear-gradient(135deg, #f0f9ff, #ede9fe)' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>Net Fayda</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: totalSavings - totalCost >= 0 ? '#059669' : '#dc2626' }}>
                                            {dataLoading ? '...' : `${(totalSavings - totalCost).toLocaleString('tr-TR')} ₺`}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* System Info */}
                            <div style={{
                                borderRadius: '14px', padding: '1.25rem 1.5rem',
                                background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                                color: 'white',
                            }}>
                                <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: '700' }}>🏢 Sistem Bilgileri</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                                        <span>Şirket</span>
                                        <span style={{ fontWeight: '600', opacity: 1 }}>{user?.company?.name || '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                                        <span>Departman</span>
                                        <span style={{ fontWeight: '600', opacity: 1 }}>{user?.department?.name || '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                                        <span>Birim</span>
                                        <span style={{ fontWeight: '600', opacity: 1 }}>{user?.unit?.name || '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                                        <span>Sicil No</span>
                                        <span style={{ fontWeight: '600', opacity: 1, fontFamily: 'monospace' }}>{user?.employeeId}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                * { box-sizing: border-box; }
            `}</style>
        </div>
    );
}
