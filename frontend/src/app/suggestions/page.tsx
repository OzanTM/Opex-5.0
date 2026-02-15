'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { suggestionsApi } from '@/lib/api';
import {
    Suggestion,
    SUGGESTION_STATUS_LABELS,
    SUGGESTION_CATEGORY_LABELS,
    SuggestionStatus,
} from '@/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';

export default function SuggestionsPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    useEffect(() => {
        if (!isAuthenticated && !isLoading) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            loadSuggestions();
        }
    }, [isAuthenticated]);

    const isCommitteeManager = user?.role === 'COMMITTEE_MANAGER' || user?.role === 'ADMIN';
    const isApprover = user?.role === 'APPROVER';

    const loadSuggestions = async () => {
        try {
            setLoading(true);
            const res = (isCommitteeManager || isApprover)
                ? await suggestionsApi.getAll()
                : await suggestionsApi.getMy();
            const data = (res as any)?.data;
            if (Array.isArray(data)) {
                setSuggestions(data);
            } else if (data?.data && Array.isArray(data.data)) {
                setSuggestions(data.data);
            } else {
                setSuggestions([]);
            }
        } catch (err: any) {
            console.error('Failed to load suggestions:', err);
            setError('Öneriler yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    if (isLoading || !isAuthenticated) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
                <div style={{ width: '3rem', height: '3rem', border: '4px solid #e5e7eb', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // Stats
    const totalCount = suggestions.length;
    const draftCount = suggestions.filter(s => s.status === 'DRAFT').length;
    const pendingCount = suggestions.filter(s => ['PENDING_COMMITTEE_REVIEW', 'PENDING_APPROVAL'].includes(s.status)).length;
    const approvedCount = suggestions.filter(s => ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(s.status)).length;

    // Filter
    const filteredSuggestions = filterStatus === 'ALL'
        ? suggestions
        : suggestions.filter(s => s.status === filterStatus);

    // Unique statuses for filter
    const uniqueStatuses = [...new Set(suggestions.map(s => s.status))];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex' }}>
            <Sidebar />

            <main style={{ marginLeft: '260px', flex: 1, padding: '2rem' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                            {isCommitteeManager ? 'Tüm Öneriler' : isApprover ? 'Onay Bekleyenler' : 'Önerilerim'}
                        </h1>
                        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                            {isCommitteeManager
                                ? 'Sistemdeki tüm önerileri yönetin ve değerlendirin.'
                                : 'Sizden onay bekleyen önerileri ve kendi önerilerinizi görüntüleyin.'}
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                    <StatsCard
                        title="Toplam"
                        value={totalCount}
                        icon="📊"
                        color="#2563eb"
                        gradientFrom="#3b82f6"
                        gradientTo="#2563eb"
                        loading={loading}
                    />
                    <StatsCard
                        title="Taslak"
                        value={draftCount}
                        icon="📝"
                        color="#4b5563"
                        gradientFrom="#9ca3af"
                        gradientTo="#4b5563"
                        loading={loading}
                    />
                    <StatsCard
                        title="Onay Bekleyen"
                        value={pendingCount}
                        icon="⏳"
                        color="#d97706"
                        gradientFrom="#fbbf24"
                        gradientTo="#d97706"
                        loading={loading}
                    />
                    <StatsCard
                        title="Tamamlanan"
                        value={approvedCount}
                        icon="✅"
                        color="#059669"
                        gradientFrom="#34d399"
                        gradientTo="#059669"
                        loading={loading}
                    />
                </div>

                {error && (
                    <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', color: '#dc2626' }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Content Area */}
                <div style={{ backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>

                    {/* Filter Tabs */}
                    {!loading && suggestions.length > 0 && (
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', overflowX: 'auto', display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => setFilterStatus('ALL')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '9999px',
                                    border: 'none',
                                    backgroundColor: filterStatus === 'ALL' ? '#eff6ff' : 'transparent',
                                    color: filterStatus === 'ALL' ? '#2563eb' : '#6b7280',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: filterStatus === 'ALL' ? '600' : '500',
                                    transition: 'all 0.2s',
                                }}
                            >
                                Tümü
                            </button>
                            {uniqueStatuses.map(status => {
                                const isActive = filterStatus === status;
                                return (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '9999px',
                                            border: 'none',
                                            backgroundColor: isActive ? '#eff6ff' : 'transparent',
                                            color: isActive ? '#2563eb' : '#6b7280',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: isActive ? '600' : '500',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {SUGGESTION_STATUS_LABELS[status as SuggestionStatus] || status}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
                            <div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid #e5e7eb', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
                            Yükleniyor...
                        </div>
                    ) : suggestions.length === 0 ? (
                        <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💡</div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Henüz öneri yok</h2>
                            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Yeni bir fikir paylaşarak başlayın.</p>
                            <button
                                onClick={() => router.push('/suggestions/new')}
                                style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.75rem 2rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' }}
                            >
                                ✨ Öneri Oluştur
                            </button>
                        </div>
                    ) : filteredSuggestions.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                            Bu filtrede görüntülenecek öneri bulunamadı.
                        </div>
                    ) : (
                        <div>
                            {filteredSuggestions.map((s, index) => {
                                const categoryLabel = s.category ? SUGGESTION_CATEGORY_LABELS[s.category as keyof typeof SUGGESTION_CATEGORY_LABELS] : null;
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => router.push(`/suggestions/${s.id}`)}
                                        style={{
                                            padding: '1.25rem 1.5rem',
                                            borderBottom: index < filteredSuggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '1.5rem'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {s.title}
                                                </h3>
                                                <StatusBadge status={s.status} size="sm" />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                                <span style={{ fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                                    {s.referenceNumber}
                                                </span>
                                                {categoryLabel && (
                                                    <span>{categoryLabel}</span>
                                                )}
                                                <span>•</span>
                                                <span>{new Date(s.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
                                            </div>
                                        </div>

                                        {(s.estimatedSavings || 0) > 0 && (
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Tahmini Kazanç</div>
                                                <div style={{ fontSize: '1rem', fontWeight: '600', color: '#059669' }}>
                                                    {s.estimatedSavings?.toLocaleString('tr-TR')} ₺
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ color: '#d1d5db' }}>→</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
