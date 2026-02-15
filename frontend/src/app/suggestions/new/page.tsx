'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { suggestionsApi } from '@/lib/api';
import {
    SuggestionCategory,
    GainCategory,
    SUGGESTION_CATEGORY_LABELS,
    GAIN_CATEGORY_LABELS,
    SuggestionFormData,
} from '@/types';

const CATEGORIES: SuggestionCategory[] = ['MAKUL_ONERI', 'KAIZEN', 'A3', 'AR_GE', 'SUGGESTION', 'OTHER'];
const GAIN_CATEGORIES: GainCategory[] = ['COST_SAVINGS', 'TIME_SAVINGS', 'QUALITY', 'SAFETY', 'ENVIRONMENT', 'PRODUCTIVITY', 'CUSTOMER_SATISFACTION', 'OTHER'];

export default function NewSuggestionPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useAuthStore();

    const [formData, setFormData] = useState<SuggestionFormData>({
        title: '',
        currentSituation: '',
        proposedSolution: '',
        expectedBenefits: '',
        category: undefined,
        gainCategories: [],
        estimatedCost: undefined,
        estimatedSavings: undefined,
        estimatedTimeSavings: undefined,
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!isAuthenticated && !isLoading) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading || !isAuthenticated) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '3rem', height: '3rem', border: '4px solid #f3f4f6', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const handleGainCategoryToggle = (cat: GainCategory) => {
        setFormData(prev => ({
            ...prev,
            gainCategories: prev.gainCategories.includes(cat)
                ? prev.gainCategories.filter(c => c !== cat)
                : [...prev.gainCategories, cat],
        }));
    };

    const handleSubmit = async (e: React.FormEvent, submitForReview: boolean) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.title.trim()) { setError('Öneri başlığı zorunludur.'); return; }
        if (!formData.currentSituation.trim()) { setError('Mevcut durum zorunludur.'); return; }
        if (!formData.proposedSolution.trim()) { setError('Önerilen çözüm zorunludur.'); return; }
        if (formData.gainCategories.length === 0) { setError('En az bir kazanç kategorisi seçmelisiniz.'); return; }

        setSubmitting(true);
        try {
            const res = await suggestionsApi.create(formData as any);
            const suggestionId = (res as any)?.data?.id;

            if (submitForReview && suggestionId) {
                await suggestionsApi.submit(suggestionId);
                setSuccess('Öneri başarıyla oluşturuldu ve incelemeye gönderildi!');
            } else {
                setSuccess('Öneri taslak olarak kaydedildi!');
            }
            setTimeout(() => router.push('/suggestions'), 1500);
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.response?.data?.error?.message || 'Öneri oluşturulurken bir hata oluştu.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: '1px solid #d1d5db',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    };

    const textareaStyle: React.CSSProperties = {
        ...inputStyle,
        minHeight: '100px',
        resize: 'vertical',
        fontFamily: 'inherit',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        marginBottom: '0.375rem',
        fontWeight: '600',
        color: '#374151',
        fontSize: '0.9rem',
    };

    const sectionStyle: React.CSSProperties = {
        marginBottom: '1.5rem',
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            {/* Header */}
            <header style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => router.push('/dashboard')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#6b7280' }}
                        >
                            ← Geri
                        </button>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                            Yeni Öneri Oluştur
                        </h1>
                    </div>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        {user?.firstName} {user?.lastName}
                    </span>
                </div>
            </header>

            {/* Form */}
            <main style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
                {error && (
                    <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem', color: '#dc2626' }}>
                        ⚠️ {error}
                    </div>
                )}
                {success && (
                    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem', color: '#16a34a' }}>
                        ✅ {success}
                    </div>
                )}

                <form onSubmit={(e) => handleSubmit(e, false)}>
                    <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb' }}>
                            📋 Temel Bilgiler
                        </h2>

                        {/* Title */}
                        <div style={sectionStyle}>
                            <label style={labelStyle}>
                                Öneri Başlığı <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Önerinizin kısa ve açıklayıcı bir başlığını yazın"
                                style={inputStyle}
                                required
                            />
                        </div>

                        {/* Category */}
                        <div style={sectionStyle}>
                            <label style={labelStyle}>Kategori</label>
                            <select
                                value={formData.category || ''}
                                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as SuggestionCategory || undefined }))}
                                style={inputStyle}
                            >
                                <option value="">Kategori Seçin</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{SUGGESTION_CATEGORY_LABELS[cat]}</option>
                                ))}
                            </select>
                        </div>

                        {/* Current Situation */}
                        <div style={sectionStyle}>
                            <label style={labelStyle}>
                                Mevcut Durum <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <textarea
                                value={formData.currentSituation}
                                onChange={e => setFormData(prev => ({ ...prev, currentSituation: e.target.value }))}
                                placeholder="Şu anki durumu detaylı olarak açıklayın. Sorun veya iyileştirme alanı nedir?"
                                style={textareaStyle}
                                required
                            />
                        </div>

                        {/* Proposed Solution */}
                        <div style={sectionStyle}>
                            <label style={labelStyle}>
                                Önerilen Çözüm <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <textarea
                                value={formData.proposedSolution}
                                onChange={e => setFormData(prev => ({ ...prev, proposedSolution: e.target.value }))}
                                placeholder="Önerdiğiniz çözümü detaylı olarak açıklayın"
                                style={textareaStyle}
                                required
                            />
                        </div>

                        {/* Expected Benefits */}
                        <div style={sectionStyle}>
                            <label style={labelStyle}>Beklenen Faydalar</label>
                            <textarea
                                value={formData.expectedBenefits || ''}
                                onChange={e => setFormData(prev => ({ ...prev, expectedBenefits: e.target.value }))}
                                placeholder="Bu önerinin uygulanması durumunda beklenen faydaları açıklayın"
                                style={textareaStyle}
                            />
                        </div>
                    </div>

                    {/* Gain Categories */}
                    <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb' }}>
                            🎯 Kazanç Kategorileri <span style={{ color: '#dc2626', fontSize: '0.85rem' }}>*</span>
                        </h2>
                        <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1rem' }}>En az bir kazanç kategorisi seçin</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                            {GAIN_CATEGORIES.map(cat => {
                                const isSelected = formData.gainCategories.includes(cat);
                                return (
                                    <label
                                        key={cat}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                                            backgroundColor: isSelected ? '#eff6ff' : '#fff',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontSize: '0.9rem',
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleGainCategoryToggle(cat)}
                                            style={{ accentColor: '#3b82f6' }}
                                        />
                                        {GAIN_CATEGORY_LABELS[cat]}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Financial Estimates */}
                    <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb' }}>
                            💰 Tahmini Maliyet / Kazanç
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div>
                                <label style={labelStyle}>Tahmini Maliyet (₺)</label>
                                <input
                                    type="number"
                                    value={formData.estimatedCost ?? ''}
                                    onChange={e => setFormData(prev => ({ ...prev, estimatedCost: e.target.value ? Number(e.target.value) : undefined }))}
                                    placeholder="0"
                                    style={inputStyle}
                                    min="0"
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Tahmini Kazanç (₺)</label>
                                <input
                                    type="number"
                                    value={formData.estimatedSavings ?? ''}
                                    onChange={e => setFormData(prev => ({ ...prev, estimatedSavings: e.target.value ? Number(e.target.value) : undefined }))}
                                    placeholder="0"
                                    style={inputStyle}
                                    min="0"
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Tahmini Zaman Tasarrufu (saat)</label>
                                <input
                                    type="number"
                                    value={formData.estimatedTimeSavings ?? ''}
                                    onChange={e => setFormData(prev => ({ ...prev, estimatedTimeSavings: e.target.value ? Number(e.target.value) : undefined }))}
                                    placeholder="0"
                                    style={inputStyle}
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #d1d5db',
                                backgroundColor: 'white',
                                color: '#374151',
                                fontWeight: '500',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                            }}
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #d1d5db',
                                backgroundColor: '#f3f4f6',
                                color: '#374151',
                                fontWeight: '500',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                fontSize: '0.95rem',
                                opacity: submitting ? 0.6 : 1,
                            }}
                        >
                            💾 Taslak Kaydet
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, true)}
                            disabled={submitting}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                fontWeight: '500',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                fontSize: '0.95rem',
                                opacity: submitting ? 0.6 : 1,
                            }}
                        >
                            {submitting ? '⏳ Gönderiliyor...' : '🚀 Kaydet ve Gönder'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
