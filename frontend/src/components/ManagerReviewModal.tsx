import React, { useState } from 'react';

interface ManagerReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { action: 'approve' | 'reject'; note?: string }) => Promise<void>;
    action: 'approve' | 'reject' | null;
}

export default function ManagerReviewModal({ isOpen, onClose, onSubmit, action }: ManagerReviewModalProps) {
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen || !action) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (action === 'reject' && !note.trim()) {
            alert('Lütfen bir red gerekçesi giriniz.');
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit({
                action,
                note
            });
            onClose();
        } catch (error) {
            console.error('Error submitting review:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const getTitle = () => {
        switch (action) {
            case 'approve': return 'Öneriyi Onayla';
            case 'reject': return 'Öneriyi Reddet';
            default: return '';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                width: '100%',
                maxWidth: '500px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1f2937' }}>
                    {getTitle()}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#4b5563', marginBottom: '0.5rem' }}>
                            {action === 'approve' ? 'Yönetici Notu (Opsiyonel)' : 'Red Gerekçesi'} <span style={{ color: action === 'reject' ? '#ef4444' : 'transparent' }}>*</span>
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={4}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #d1d5db',
                                fontSize: '1rem',
                                outline: 'none',
                                resize: 'vertical'
                            }}
                            placeholder={action === 'approve' ? 'Varsa eklemek istediğiniz notlar...' : 'Red gerekçenizi detaylı bir şekilde açıklayınız...'}
                            required={action === 'reject'}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #d1d5db',
                                backgroundColor: 'white',
                                color: '#374151',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
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
                                border: 'none',
                                backgroundColor: action === 'reject' ? '#ef4444' : '#10b981',
                                color: 'white',
                                fontWeight: '600',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                opacity: submitting ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}
                        >
                            {submitting ? 'İşleniyor...' : action === 'approve' ? 'Onayla' : 'Reddet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
