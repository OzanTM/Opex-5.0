'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface DashboardStats {
    suggestions: {
        total: number;
        approved: number;
        completed: number;
        recent: number;
        byStatus: { status: string; count: number }[];
        byCategory: { category: string; count: number }[];
    };
    projects: {
        total: number;
        active: number;
    };
    financial: {
        estimatedSavings: number;
        actualSavings: number;
        estimatedCost: number;
        actualCost: number;
    };
    approvals: {
        pending: number;
    };
}

export default function AdminPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        if (user?.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }
        fetchStats();
    }, [isAuthenticated, user, router]);

    const fetchStats = async () => {
        try {
            const response = await api.get('/reports/dashboard');
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M TL`;
        if (val >= 1000) return `${(val / 1000).toFixed(0)}K TL`;
        return `${val.toLocaleString('tr-TR')} TL`;
    };

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
        <div className="admin-page">
            <div className="page-header">
                <h1>Admin Paneli</h1>
                <p>Sistem yönetimi ve istatistikler</p>
            </div>

            {/* Quick Stats */}
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-icon">
                        <i className="bi bi-lightbulb"></i>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.suggestions.total || 0}</span>
                        <span className="stat-label">Toplam Öneri</span>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon">
                        <i className="bi bi-check-circle"></i>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.suggestions.approved || 0}</span>
                        <span className="stat-label">Onaylanan</span>
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon">
                        <i className="bi bi-kanban"></i>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.projects.active || 0}</span>
                        <span className="stat-label">Aktif Proje</span>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon">
                        <i className="bi bi-clock"></i>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.approvals.pending || 0}</span>
                        <span className="stat-label">Bekleyen Onay</span>
                    </div>
                </div>
            </div>

            {/* Financial Summary */}
            <div className="card financial-card">
                <div className="card-header">
                    <h3>Finansal Özet</h3>
                </div>
                <div className="card-body">
                    <div className="financial-grid">
                        <div className="financial-item">
                            <span className="financial-label">Tahmini Tasarruf</span>
                            <span className="financial-value success">
                                {formatCurrency(stats?.financial.estimatedSavings || 0)}
                            </span>
                        </div>
                        <div className="financial-item">
                            <span className="financial-label">Gerçeklesen Tasarruf</span>
                            <span className="financial-value success">
                                {formatCurrency(stats?.financial.actualSavings || 0)}
                            </span>
                        </div>
                        <div className="financial-item">
                            <span className="financial-label">Tahmini Maliyet</span>
                            <span className="financial-value danger">
                                {formatCurrency(stats?.financial.estimatedCost || 0)}
                            </span>
                        </div>
                        <div className="financial-item">
                            <span className="financial-label">Gerçeklesen Maliyet</span>
                            <span className="financial-value danger">
                                {formatCurrency(stats?.financial.actualCost || 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Menu */}
            <div className="admin-menu-grid">
                <Link href="/admin/users" className="admin-menu-card">
                    <i className="bi bi-people"></i>
                    <span>Kullanici Yönetimi</span>
                    <p>Kullanicilari görüntüle, ekle, düzenle</p>
                </Link>
                <Link href="/admin/companies" className="admin-menu-card">
                    <i className="bi bi-building"></i>
                    <span>Sirket Yönetimi</span>
                    <p>Sirket, departman ve birim yapisi</p>
                </Link>
                <Link href="/admin/settings" className="admin-menu-card">
                    <i className="bi bi-gear"></i>
                    <span>Sistem Ayarlari</span>
                    <p>Uygulama ayarlari ve yapilandirma</p>
                </Link>
                <Link href="/admin/audit-logs" className="admin-menu-card">
                    <i className="bi bi-journal-text"></i>
                    <span>Denetim Kayitlari</span>
                    <p>Sistem hareketleri ve loglar</p>
                </Link>
                <Link href="/admin/email-templates" className="admin-menu-card">
                    <i className="bi bi-envelope"></i>
                    <span>E-posta Sablonlari</span>
                    <p>E-posta sablonlarini düzenle</p>
                </Link>
                <Link href="/reports" className="admin-menu-card">
                    <i className="bi bi-bar-chart"></i>
                    <span>Raporlar</span>
                    <p>Detayli raporlar ve analizler</p>
                </Link>
            </div>
        </div>
    );
}