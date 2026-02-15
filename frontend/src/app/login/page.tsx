'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            console.log('Login attempt with:', { employeeId });
            const response = await authApi.login(employeeId, password);
            console.log('Login response:', response);

            if (response.success && response.data) {
                console.log('Login successful, storing user...');
                login(
                    response.data.user,
                    response.data.accessToken,
                    response.data.refreshToken
                );

                if (response.data.requiresPasswordChange) {
                    console.log('Redirecting to change-password');
                    router.push('/change-password');
                } else {
                    console.log('Redirecting to dashboard');
                    router.push('/dashboard');
                }
            } else {
                const errMsg = response.message || 'Giriş başarısız';
                console.log('Login failed:', errMsg);
                setError(errMsg);
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const errorMsg = err?.response?.data?.message || err?.message || 'Giriş başarısız. Lütfen tekrar deneyin.';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, rgb(240, 249, 255), rgb(224, 242, 254))', padding: '1rem' }}>
            <div style={{ width: '100%', maxWidth: '28rem' }}>
                {/* Logo and Title */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        O5
                    </div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                        OpEx 5.0
                    </h1>
                    <p style={{ color: '#4b5563', marginTop: '0.5rem' }}>
                        Öneri Yönetim Sistemi
                    </p>
                </div>

                {/* Login Form */}
                <div style={{ backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '2rem' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label htmlFor="employeeId" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                                Sicil No
                            </label>
                            <input
                                id="employeeId"
                                type="text"
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                                style={{ width: '100%', height: '2.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box' }}
                                placeholder="Sicil numaranızı girin"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label htmlFor="password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                                Şifre
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', height: '2.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box' }}
                                placeholder="Şifrenizi girin"
                                required
                            />
                        </div>

                        {error && (
                            <div data-testid="login-error" style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '0.875rem', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{ width: '100%', height: '2.75rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {isLoading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg style={{ animation: 'spin 1s linear infinite', marginRight: '0.75rem', height: '1.25rem', width: '1.25rem', color: 'white' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Giriş yapılıyor...
                                </span>
                            ) : (
                                'Giriş Yap'
                            )}
                        </button>

                        <div style={{ textAlign: 'center' }}>
                            <button
                                type="button"
                                onClick={() => router.push('/forgot-password')}
                                style={{ fontSize: '0.875rem', color: '#3b82f6', textDecoration: 'none', border: 'none', background: 'none', cursor: 'pointer' }}
                            >
                                Şifremi Unuttum
                            </button>
                        </div>

                        {/* Test Users */}
                        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                            <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', marginBottom: '0.5rem' }}>
                                TEST HESAPLARI (Demo için)
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => { setEmployeeId('USER001'); setPassword('Test1234'); }}
                                    style={{ fontSize: '0.75rem', padding: '0.5rem', backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #0284c7', borderRadius: '0.25rem', cursor: 'pointer' }}
                                >
                                    Kullanıcı: USER001
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setEmployeeId('ADMIN001'); setPassword('Admin123'); }}
                                    style={{ fontSize: '0.75rem', padding: '0.5rem', backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #0284c7', borderRadius: '0.25rem', cursor: 'pointer' }}
                                >
                                    Admin: ADMIN001
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem', marginTop: '2rem' }}>
                    © 2024 OpEx 5.0 - Tüm hakları saklıdır.
                </p>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}