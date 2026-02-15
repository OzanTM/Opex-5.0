'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';

export default function ChangePasswordPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '2rem', height: '2rem', border: '2px solid #e5e7eb', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        // Validation
        if (newPassword !== confirmPassword) {
            setError('Yeni şifreler eşleşmiyor');
            setIsLoading(false);
            return;
        }

        if (newPassword.length < 8) {
            setError('Şifre en az 8 karakter olmalı');
            setIsLoading(false);
            return;
        }

        try {
            console.log('Changing password...');
            const response = await authApi.changePassword(currentPassword, newPassword, confirmPassword);
            console.log('Password change response:', response);

            if (response.success) {
                setSuccess('Şifre başarıyla değiştirildi!');
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1500);
            } else {
                setError(response.message || 'Şifre değiştirme başarısız');
            }
        } catch (err: any) {
            console.error('Password change error:', err);
            const errorMsg = err?.response?.data?.message || err?.message || 'Şifre değiştirme başarısız. Lütfen tekrar deneyin.';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, rgb(240, 249, 255), rgb(224, 242, 254))', padding: '1rem' }}>
            <div style={{ width: '100%', maxWidth: '28rem' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                        Şifre Değiştir
                    </h1>
                    <p style={{ color: '#4b5563' }}>
                        Ilk kez giriş yapıyorsunuz. Lütfen şifrenizi değiştirin.
                    </p>
                </div>

                {/* Form */}
                <div style={{ backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '2rem' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label htmlFor="currentPassword" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                                Mevcut Şifre
                            </label>
                            <input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                style={{ width: '100%', height: '2.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box' }}
                                placeholder="Mevcut şifrenizi girin"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label htmlFor="newPassword" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                                Yeni Şifre
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={{ width: '100%', height: '2.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box' }}
                                placeholder="Yeni şifrenizi girin"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                                Yeni Şifre (Tekrar)
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{ width: '100%', height: '2.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box' }}
                                placeholder="Yeni şifrenizi tekrar girin"
                                required
                            />
                        </div>

                        {error && (
                            <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '0.875rem', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div style={{ backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '0.875rem', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{ width: '100%', height: '2.75rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.5 : 1 }}
                        >
                            {isLoading ? 'Değiştiriliyor...' : 'Şifre Değiştir'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
