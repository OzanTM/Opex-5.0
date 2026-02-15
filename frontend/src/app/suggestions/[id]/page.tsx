'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { suggestionsApi } from '@/lib/api';
import CommitteeReviewModal from '@/components/CommitteeReviewModal';
import ManagerReviewModal from '@/components/ManagerReviewModal';
import {
    Suggestion,
    SuggestionStatus,
    getStatusLabelTr,
    SUGGESTION_CATEGORY_LABELS,
    GAIN_CATEGORY_LABELS,
    GainCategory,
} from '@/types';

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    DRAFT: { bg: '#f9fafb', text: '#374151', border: '#d1d5db' },
    PENDING_COMMITTEE_REVIEW: { bg: '#fffbeb', text: '#92400e', border: '#fcd34d' },
    COMMITTEE_REVISION_REQUESTED: { bg: '#fff7ed', text: '#9a3412', border: '#fdba74' },
    COMMITTEE_REJECTED: { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
    PENDING_APPROVAL: { bg: '#eff6ff', text: '#1e40af', border: '#93c5fd' },
    APPROVER_REJECTED: { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
    APPROVED: { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
    IN_PROGRESS: { bg: '#eef2ff', text: '#3730a3', border: '#a5b4fc' },
    COMPLETED: { bg: '#ecfdf5', text: '#14532d', border: '#6ee7b7' },
    CANCELLED: { bg: '#f9fafb', text: '#6b7280', border: '#d1d5db' },
};

const STATUS_ICONS: Record<string, string> = {
    DRAFT: '📝',
    PENDING_COMMITTEE_REVIEW: '⏳',
    COMMITTEE_REVISION_REQUESTED: '🔄',
    COMMITTEE_REJECTED: '❌',
    PENDING_APPROVAL: '👔',
    APPROVER_REJECTED: '❌',
    APPROVED: '✅',
    IN_PROGRESS: '🚀',
    COMPLETED: '🎉',
    CANCELLED: '🚫',
};

// Status flow for timeline
const STATUS_FLOW = [
    'DRAFT',
    'PENDING_COMMITTEE_REVIEW',
    'PENDING_APPROVAL',
    'APPROVED',
    'IN_PROGRESS',
    'COMPLETED',
];

export default function SuggestionDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request_revision' | null>(null);
    const [managerReviewModalOpen, setManagerReviewModalOpen] = useState(false);
    const [managerReviewAction, setManagerReviewAction] = useState<'approve' | 'reject' | null>(null);

    useEffect(() => {
        if (!isAuthenticated && !isLoading) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated && id) {
            loadSuggestion();
        }
    }, [isAuthenticated, id]);

    const isCommitteeManager = user?.role === 'COMMITTEE_MANAGER' || user?.role === 'ADMIN';
    const isApprover = user?.role === 'APPROVER' || user?.role === 'ADMIN';

    const loadSuggestion = async () => {
        try {
            setLoading(true);
            const res = await suggestionsApi.getById(Number(id));
            const data = (res as any)?.data || res;
            setSuggestion(data);
        } catch (err: any) {
            console.error('Failed to load suggestion:', err);
            if (err?.response?.status === 404) {
                setError('Öneri bulunamadı.');
            } else {
                setError('Öneri yüklenirken bir hata oluştu.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!suggestion || suggestion.status !== 'DRAFT') return;
        if (!confirm('Bu öneriyi komiteye göndermek istediğinize emin misiniz?')) return;
        try {
            setSubmitting(true);
            await suggestionsApi.submit(suggestion.id);
            await loadSuggestion();
        } catch (err: any) {
            console.error('Failed to submit suggestion:', err);
            alert('Öneri gönderilirken bir hata oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    const openReviewModal = (action: 'approve' | 'reject' | 'request_revision') => {
        setReviewAction(action);
        setReviewModalOpen(true);
    };

    const handleReviewSubmit = async (data: { action: 'approve' | 'reject' | 'request_revision'; category?: string; note?: string }) => {
        if (!suggestion) return;
        try {
            await suggestionsApi.committeeReview(suggestion.id, {
                action: data.action,
                category: data.category,
                notes: data.action === 'approve' ? data.note : undefined,
                rejectionReason: data.action === 'reject' ? data.note : undefined,
                revisionRequestReason: data.action === 'request_revision' ? data.note : undefined,
                // TODO: Project Leader and Team Members selection to be implemented
                projectLeaderId: data.action === 'approve' ? user?.id : undefined // Temporary: assign current user (committee) as leader for now to bypass API validation if any
            });
            await loadSuggestion();
            setReviewModalOpen(false);
            setReviewAction(null);
            alert(`Öneri başarıyla ${data.action === 'approve' ? 'onaylandı' : data.action === 'reject' ? 'reddedildi' : 'revizyona gönderildi'}.`);
        } catch (err: any) {
            console.error('Failed to review suggestion:', err);
            alert('İşlem sırasında bir hata oluştu: ' + (err.response?.data?.message || err.message));
        }
    };

    const openManagerReviewModal = (action: 'approve' | 'reject') => {
        setManagerReviewAction(action);
        setManagerReviewModalOpen(true);
    };

    const handleManagerReviewSubmit = async (data: { action: 'approve' | 'reject'; note?: string }) => {
        if (!suggestion) return;
        try {
            if (data.action === 'approve') {
                await suggestionsApi.approve(suggestion.id, data.note);
            } else {
                await suggestionsApi.reject(suggestion.id, data.note || '');
            }
            await loadSuggestion();
            setManagerReviewModalOpen(false);
            setManagerReviewAction(null);
            alert(`Öneri başarıyla ${data.action === 'approve' ? 'onaylandı' : 'reddedildi'}.`);
        } catch (err: any) {
            console.error('Failed to review suggestion:', err);
            alert('İşlem sırasında bir hata oluştu: ' + (err.response?.data?.message || err.message));
        }
    };

    if (isLoading || !isAuthenticated) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '3rem', height: '3rem', border: '4px solid #f3f4f6', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5' }}>
                <div style={{ textAlign: 'center', color: '#6b7280' }}>
                    <div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid #e5e7eb', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                    Yükleniyor...
                </div>
            </div>
        );
    }

    if (error || !suggestion) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5' }}>
                <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxWidth: '400px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                        {error || 'Öneri bulunamadı'}
                    </h2>
                    <button
                        onClick={() => router.push('/suggestions')}
                        style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: '500', marginTop: '1rem' }}
                    >
                        ← Önerilerime Dön
                    </button>
                </div>
            </div>
        );
    }

    const statusColor = STATUS_COLORS[suggestion.status] || STATUS_COLORS.DRAFT;
    const statusIcon = STATUS_ICONS[suggestion.status] || '📋';
    const categoryLabel = suggestion.category ? SUGGESTION_CATEGORY_LABELS[suggestion.category as keyof typeof SUGGESTION_CATEGORY_LABELS] : null;
    const gainCategories: string[] = Array.isArray(suggestion.gainCategories)
        ? suggestion.gainCategories
        : [];

    // Determine current step in flow
    const currentFlowIndex = STATUS_FLOW.indexOf(suggestion.status);

    const cardStyle: React.CSSProperties = {
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        marginBottom: '1rem',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '0.8rem',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.375rem',
    };

    const valueStyle: React.CSSProperties = {
        fontSize: '0.95rem',
        color: '#111827',
        lineHeight: '1.6',
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            {/* Header */}
            <header style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', color: 'white' }}>
                <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <button
                            onClick={() => router.push('/suggestions')}
                            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}
                        >
                            ← Önerilerim
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', opacity: 0.8 }}>
                                {suggestion.referenceNumber}
                            </span>
                            {suggestion.status === 'DRAFT' && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    style={{
                                        background: submitting ? 'rgba(255,255,255,0.3)' : 'linear-gradient(135deg, #10b981, #059669)',
                                        border: 'none',
                                        cursor: submitting ? 'not-allowed' : 'pointer',
                                        fontSize: '0.85rem',
                                        color: 'white',
                                        padding: '0.5rem 1.25rem',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                                    }}
                                >
                                    {submitting ? '⏳ Gönderiliyor...' : '🚀 Komiteye Gönder'}
                                </button>
                            )}
                        </div>
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>
                        {suggestion.title}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{
                            padding: '0.3rem 0.85rem',
                            borderRadius: '9999px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                            border: `1px solid ${statusColor.border}`,
                        }}>
                            {statusIcon} {getStatusLabelTr(suggestion.status)}
                        </span>
                        <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                            📅 {new Date(suggestion.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                        {categoryLabel && (
                            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                                📁 {categoryLabel}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* Committee Actions Panel */}
            {isCommitteeManager && suggestion.status === 'PENDING_COMMITTEE_REVIEW' && (
                <div style={{ maxWidth: '72rem', margin: '2rem auto 0', padding: '0 1.5rem' }}>
                    <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#9a3412', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                ⚡ Komite İşlemleri
                            </h3>
                            <p style={{ color: '#c2410c', fontSize: '0.95rem' }}>
                                Bu öneri komite değerlendirmesi beklemektedir. Lütfen aşağıdaki aksiyonlardan birini seçiniz.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => openReviewModal('approve')}
                                style={{
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '0.5rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'background 0.2s',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                            >
                                ✅ Onayla
                            </button>
                            <button
                                onClick={() => openReviewModal('request_revision')}
                                style={{
                                    backgroundColor: '#f59e0b',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '0.5rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'background 0.2s',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
                            >
                                🔄 Revizyon İste
                            </button>
                            <button
                                onClick={() => openReviewModal('reject')}
                                style={{
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '0.5rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'background 0.2s',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                            >
                                ❌ Reddet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <CommitteeReviewModal
                isOpen={reviewModalOpen}
                onClose={() => { setReviewModalOpen(false); setReviewAction(null); }}
                onSubmit={handleReviewSubmit}
                action={reviewAction}
            />

            {/* Manager Actions Panel */}
            {isApprover && suggestion.status === 'PENDING_APPROVAL' && (
                <div style={{ maxWidth: '72rem', margin: '2rem auto 0', padding: '0 1.5rem' }}>
                    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#166534', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                👔 Yönetici İşlemleri
                            </h3>
                            <p style={{ color: '#15803d', fontSize: '0.95rem' }}>
                                Bu öneri onayınızı beklemektedir. Lütfen aşağıdaki aksiyonlardan birini seçiniz.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => openManagerReviewModal('approve')}
                                style={{
                                    backgroundColor: '#16a34a',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '0.5rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'background 0.2s',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                            >
                                ✅ Onayla
                            </button>
                            <button
                                onClick={() => openManagerReviewModal('reject')}
                                style={{
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '0.5rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'background 0.2s',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                            >
                                ❌ Reddet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ManagerReviewModal
                isOpen={managerReviewModalOpen}
                onClose={() => { setManagerReviewModalOpen(false); setManagerReviewAction(null); }}
                onSubmit={handleManagerReviewSubmit}
                action={managerReviewAction}
            />

            <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
                    {/* Left Column - Main Content */}
                    <div>
                        {/* Mevcut Durum */}
                        <div style={cardStyle}>
                            <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e5e7eb' }}>
                                📋 Mevcut Durum
                            </h2>
                            <p style={valueStyle}>{suggestion.currentSituation}</p>
                        </div>

                        {/* Önerilen Çözüm */}
                        <div style={cardStyle}>
                            <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e5e7eb' }}>
                                💡 Önerilen Çözüm
                            </h2>
                            <p style={valueStyle}>{suggestion.proposedSolution}</p>
                        </div>

                        {/* Beklenen Faydalar */}
                        {suggestion.expectedBenefits && (
                            <div style={cardStyle}>
                                <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e5e7eb' }}>
                                    🎯 Beklenen Faydalar
                                </h2>
                                <p style={valueStyle}>{suggestion.expectedBenefits}</p>
                            </div>
                        )}

                        {/* Kazanç Kategorileri */}
                        {gainCategories.length > 0 && (
                            <div style={cardStyle}>
                                <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e5e7eb' }}>
                                    📊 Kazanç Kategorileri
                                </h2>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {gainCategories.map(cat => (
                                        <span key={cat} style={{
                                            padding: '0.375rem 0.85rem',
                                            backgroundColor: '#eff6ff',
                                            color: '#1e40af',
                                            borderRadius: '9999px',
                                            fontSize: '0.8rem',
                                            fontWeight: '500',
                                            border: '1px solid #bfdbfe',
                                        }}>
                                            {GAIN_CATEGORY_LABELS[cat as GainCategory] || cat}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Sidebar */}
                    <div>
                        {/* Süreç Adımları Timeline */}
                        <div style={cardStyle}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e5e7eb' }}>
                                🔄 Süreç Durumu
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {STATUS_FLOW.map((step, idx) => {
                                    const isCompleted = currentFlowIndex > idx;
                                    const isCurrent = suggestion.status === step || (currentFlowIndex === -1 && idx === 0);
                                    const isPending = !isCompleted && !isCurrent;
                                    const color = isCompleted ? '#16a34a' : isCurrent ? '#2563eb' : '#d1d5db';
                                    const statusLabel = getStatusLabelTr(step);
                                    return (
                                        <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '24px' }}>
                                                <div style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    backgroundColor: isCompleted ? '#16a34a' : isCurrent ? '#2563eb' : '#f3f4f6',
                                                    border: `2px solid ${color}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.6rem',
                                                    color: 'white',
                                                    flexShrink: 0,
                                                }}>
                                                    {isCompleted ? '✓' : isCurrent ? '●' : ''}
                                                </div>
                                                {idx < STATUS_FLOW.length - 1 && (
                                                    <div style={{
                                                        width: '2px',
                                                        height: '24px',
                                                        backgroundColor: isCompleted ? '#16a34a' : '#e5e7eb',
                                                    }}></div>
                                                )}
                                            </div>
                                            <span style={{
                                                fontSize: '0.8rem',
                                                color: isPending ? '#9ca3af' : '#111827',
                                                fontWeight: isCurrent ? '600' : '400',
                                                paddingTop: '1px',
                                            }}>
                                                {statusLabel}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tahmini Maliyet / Kazanç */}
                        <div style={cardStyle}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e5e7eb' }}>
                                💰 Finansal Bilgiler
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div>
                                    <div style={labelStyle}>Tahmini Maliyet</div>
                                    <div style={{ ...valueStyle, fontWeight: '600' }}>
                                        {suggestion.estimatedCost != null && suggestion.estimatedCost > 0
                                            ? `${suggestion.estimatedCost.toLocaleString('tr-TR')} ₺`
                                            : '—'}
                                    </div>
                                </div>
                                <div>
                                    <div style={labelStyle}>Tahmini Kazanç</div>
                                    <div style={{ ...valueStyle, fontWeight: '600', color: '#059669' }}>
                                        {suggestion.estimatedSavings != null && suggestion.estimatedSavings > 0
                                            ? `${suggestion.estimatedSavings.toLocaleString('tr-TR')} ₺`
                                            : '—'}
                                    </div>
                                </div>
                                <div>
                                    <div style={labelStyle}>Tahmini Zaman Tasarrufu</div>
                                    <div style={valueStyle}>
                                        {suggestion.estimatedTimeSavings != null && suggestion.estimatedTimeSavings > 0
                                            ? `${suggestion.estimatedTimeSavings} saat`
                                            : '—'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bilgiler */}
                        <div style={cardStyle}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e5e7eb' }}>
                                ℹ️ Detaylar
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div>
                                    <div style={labelStyle}>Oluşturan</div>
                                    <div style={valueStyle}>{suggestion.user?.firstName} {suggestion.user?.lastName}</div>
                                </div>
                                <div>
                                    <div style={labelStyle}>Departman</div>
                                    <div style={valueStyle}>{suggestion.department?.name || '—'}</div>
                                </div>
                                <div>
                                    <div style={labelStyle}>Birim</div>
                                    <div style={valueStyle}>{suggestion.unit?.name || '—'}</div>
                                </div>
                                <div>
                                    <div style={labelStyle}>Oluşturulma</div>
                                    <div style={valueStyle}>
                                        {new Date(suggestion.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                {suggestion.submittedAt && (
                                    <div>
                                        <div style={labelStyle}>Gönderilme</div>
                                        <div style={valueStyle}>
                                            {new Date(suggestion.submittedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
