'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
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

export default function ReportsPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        if (!['ADMIN', 'COMMITTEE_MANAGER'].includes(user?.role || '')) {
            router.push('/dashboard');
            return;
        }
        fetchStats();
    }, [isAuthenticated, user, router]);

    const fetchStats = async () => {
        try {
            const params = new URLSearchParams();
            if (dateRange.startDate) params.append('startDate', dateRange.startDate);
            if (dateRange.endDate) params.append('endDate', dateRange.endDate);

            const response = await api.get(`/reports/dashboard?${params.toString()}`);
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

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            DRAFT: 'Taslak',
            SUBMITTED: 'Gönderildi',
            UNDER_REVIEW: 'Inceleniyor',
            REVISION_REQUESTED: 'Revizyon Istendi',
            APPROVED: 'Onaylandi',
            REJECTED: 'Reddedildi',
            IN_PROGRESS: 'Devam Ediyor',
            COMPLETED: 'Tamamlandi',
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            DRAFT: '#6b7280',
            SUBMITTED: '#3b82f6',
            UNDER_REVIEW: '#8b5cf6',
            REVISION_REQUESTED: '#f59e0b',
            APPROVED: '#10b981',
            REJECTED: '#ef4444',
            IN_PROGRESS: '#0ea5e9',
            COMPLETED: '#059669',
        };
        return colors[status] || '#6b7280';
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
        <div className="reports-page">
            <div className="page-header">
                <div>
                    <h1>Raporlar</h1>
                    <p>Sistem istatistikleri ve analizler</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={() => window.print()}>
                        <i className="bi bi-printer"></i>
                        Yazdir
                    </button>
                    <button className="btn btn-primary">
                        <i className="bi bi-download"></i>
                        Disa Aktar
                    </button>
                </div>
            </div>

            {/* Date Filter */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Baslangiç Tarihi</label>
                            <input
                                type="date"
                                className="form-input"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Bitis Tarihi</label>
                            <input
                                type="date"
                                className="form-input"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={fetchStats}>
                            <i className="bi bi-funnel"></i>
                            Filtrele
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
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
                        <i className="bi bi-currency-dollar"></i>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{formatCurrency(stats?.financial.estimatedSavings || 0)}</span>
                        <span className="stat-label">Tahmini Tasarruf</span>
                    </div>
                </div>
            </div>

            <div className="reports-grid">
                {/* Status Distribution */}
                <div className="card">
                    <div className="card-header">
                        <h3>Durum Dagilimi</h3>
                    </div>
                    <div className="card-body">
                        <div className="chart-bars">
                            {stats?.suggestions.byStatus.map((item) => (
                                <div key={item.status} className="chart-bar-item">
                                    <div className="chart-bar-label">
                                        <span>{getStatusLabel(item.status)}</span>
                                        <span className="chart-bar-value">{item.count}</span>
                                    </div>
                                    <div className="chart-bar-track">
                                        <div
                                            className="chart-bar-fill"
                                            style={{
                                                width: `${(item.count / (stats?.suggestions.total || 1)) * 100}%`,
                                                background: getStatusColor(item.status),
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="card">
                    <div className="card-header">
                        <h3>Kategori Dagilimi</h3>
                    </div>
                    <div className="card-body">
                        <div className="chart-bars">
                            {stats?.suggestions.byCategory.map((item, index) => (
                                <div key={item.category} className="chart-bar-item">
                                    <div className="chart-bar-label">
                                        <span>{item.category || 'Kategorisiz'}</span>
                                        <span className="chart-bar-value">{item.count}</span>
                                    </div>
                                    <div className="chart-bar-track">
                                        <div
                                            className="chart-bar-fill"
                                            style={{
                                                width: `${(item.count / (stats?.suggestions.total || 1)) * 100}%`,
                                                background: `hsl(${(index * 45) % 360}, 70%, 50%)`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="card">
                    <div className="card-header">
                        <h3>Finansal Özet</h3>
                    </div>
                    <div className="card-body">
                        <div className="financial-summary">
                            <div className="financial-row">
                                <span className="financial-label">Tahmini Tasarruf</span>
                                <span className="financial-value success">
                                    {formatCurrency(stats?.financial.estimatedSavings || 0)}
                                </span>
                            </div>
                            <div className="financial-row">
                                <span className="financial-label">Gerçeklesen Tasarruf</span>
                                <span className="financial-value success">
                                    {formatCurrency(stats?.financial.actualSavings || 0)}
                                </span>
                            </div>
                            <div className="financial-row">
                                <span className="financial-label">Tahmini Maliyet</span>
                                <span className="financial-value danger">
                                    {formatCurrency(stats?.financial.estimatedCost || 0)}
                                </span>
                            </div>
                            <div className="financial-row">
                                <span className="financial-label">Gerçeklesen Maliyet</span>
                                <span className="financial-value danger">
                                    {formatCurrency(stats?.financial.actualCost || 0)}
                                </span>
                            </div>
                            <div className="financial-row total">
                                <span className="financial-label">Net Tasarruf</span>
                                <span className="financial-value success">
                                    {formatCurrency(
                                        (stats?.financial.actualSavings || 0) - (stats?.financial.actualCost || 0)
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project Stats */}
                <div className="card">
                    <div className="card-header">
                        <h3>Proje Istatistikleri</h3>
                    </div>
                    <div className="card-body">
                        <div className="project-stats-summary">
                            <div className="project-stat-item">
                                <span className="project-stat-value">{stats?.projects.total || 0}</span>
                                <span className="project-stat-label">Toplam Proje</span>
                            </div>
                            <div className="project-stat-item">
                                <span className="project-stat-value">{stats?.projects.active || 0}</span>
                                <span className="project-stat-label">Aktif Proje</span>
                            </div>
                            <div className="project-stat-item">
                                <span className="project-stat-value">{stats?.suggestions.completed || 0}</span>
                                <span className="project-stat-label">Tamamlanan</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}