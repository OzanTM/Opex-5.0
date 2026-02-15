'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface Project {
    id: number;
    uuid: string;
    name: string;
    description: string;
    status: string;
    progress: number;
    startDate: string;
    estimatedEndDate: string;
    actualEndDate: string;
    createdAt: string;
    projectLeader: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    suggestion: {
        id: number;
        referenceNumber: string;
        title: string;
        company: { name: string };
    };
    _count?: {
        teamMembers: number;
        milestones: number;
    };
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    PLANNED: { color: '#6b7280', bg: '#f3f4f6', label: 'Planlanmis' },
    IN_PROGRESS: { color: '#2563eb', bg: '#dbeafe', label: 'Devam Ediyor' },
    ON_HOLD: { color: '#d97706', bg: '#fef3c7', label: 'Beklemede' },
    COMPLETED: { color: '#059669', bg: '#d1fae5', label: 'Tamamlandi' },
    CANCELLED: { color: '#dc2626', bg: '#fee2e2', label: 'Iptal Edildi' },
};

export default function ProjectsPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        status: '',
        search: '',
    });

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        fetchProjects();
    }, [isAuthenticated, router]);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter((p) => {
        if (filter.status && p.status !== filter.status) return false;
        if (filter.search) {
            const search = filter.search.toLowerCase();
            return (
                p.name.toLowerCase().includes(search) ||
                p.suggestion?.title.toLowerCase().includes(search) ||
                p.suggestion?.referenceNumber.toLowerCase().includes(search)
            );
        }
        return true;
    });

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
        <div className="projects-page">
            <div className="page-header">
                <div>
                    <h1>Projeler</h1>
                    <p>Önerilerden olusturulan projeleri görüntüleyin</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div className="form-group" style={{ margin: 0, flex: 1 }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Proje ara..."
                                value={filter.search}
                                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                            />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <select
                                className="form-select"
                                value={filter.status}
                                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                                style={{ width: '200px' }}
                            >
                                <option value="">Tüm Durumlar</option>
                                {Object.entries(statusConfig).map(([key, val]) => (
                                    <option key={key} value={key}>
                                        {val.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Projects Grid */}
            <div className="projects-grid">
                {filteredProjects.map((project) => (
                    <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="project-card"
                    >
                        <div className="project-header">
                            <span
                                className="project-status"
                                style={{
                                    color: statusConfig[project.status]?.color,
                                    background: statusConfig[project.status]?.bg,
                                }}
                            >
                                {statusConfig[project.status]?.label || project.status}
                            </span>
                            <span className="project-ref">{project.suggestion?.referenceNumber}</span>
                        </div>
                        <h3 className="project-name">{project.name}</h3>
                        <p className="project-title">{project.suggestion?.title}</p>
                        <div className="project-progress">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${project.progress}%` }}
                                />
                            </div>
                            <span className="progress-text">%{project.progress}</span>
                        </div>
                        <div className="project-meta">
                            <div className="project-leader">
                                <i className="bi bi-person"></i>
                                <span>
                                    {project.projectLeader?.firstName} {project.projectLeader?.lastName}
                                </span>
                            </div>
                            <div className="project-company">
                                <i className="bi bi-building"></i>
                                <span>{project.suggestion?.company?.name}</span>
                            </div>
                        </div>
                        <div className="project-stats">
                            <span>
                                <i className="bi bi-people"></i> {project._count?.teamMembers || 0} Ekip
                            </span>
                            <span>
                                <i className="bi bi-flag"></i> {project._count?.milestones || 0} Kilometre
                            </span>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredProjects.length === 0 && (
                <div className="empty-state">
                    <i className="bi bi-kanban"></i>
                    <h3>Proje Bulunamadi</h3>
                    <p>Arama kriterlerinize uygun proje bulunamadi.</p>
                </div>
            )}
        </div>
    );
}