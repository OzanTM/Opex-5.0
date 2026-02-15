import React from 'react';
import { SuggestionStatus, SUGGESTION_STATUS_LABELS } from '@/types';

interface StatusBadgeProps {
    status: string; // Allow string to handle potential API inconsistencies, but ideally SuggestionStatus
    showIcon?: boolean;
    size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    DRAFT: { bg: '#f9fafb', text: '#374151', border: '#d1d5db', icon: '📝' },
    PENDING_COMMITTEE_REVIEW: { bg: '#fffbeb', text: '#92400e', border: '#fcd34d', icon: '⏳' },
    COMMITTEE_REVISION_REQUESTED: { bg: '#fff7ed', text: '#9a3412', border: '#fdba74', icon: '🔄' },
    COMMITTEE_REJECTED: { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5', icon: '❌' },
    PENDING_APPROVAL: { bg: '#eff6ff', text: '#1e40af', border: '#93c5fd', icon: '📋' },
    APPROVER_REJECTED: { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5', icon: '❌' },
    APPROVED: { bg: '#f0fdf4', text: '#166534', border: '#86efac', icon: '✅' },
    IN_PROGRESS: { bg: '#eef2ff', text: '#3730a3', border: '#a5b4fc', icon: '🚀' },
    COMPLETED: { bg: '#ecfdf5', text: '#14532d', border: '#6ee7b7', icon: '🎉' },
    CANCELLED: { bg: '#f9fafb', text: '#6b7280', border: '#d1d5db', icon: '🚫' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = true, size = 'md' }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    const label = SUGGESTION_STATUS_LABELS[status as SuggestionStatus] || status;

    const baseStyle: React.CSSProperties = {
        padding: size === 'sm' ? '0.15rem 0.5rem' : '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: size === 'sm' ? '0.7rem' : '0.75rem',
        fontWeight: '600',
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        flexShrink: 0,
    };

    return (
        <span style={baseStyle}>
            {showIcon && <span>{config.icon}</span>}
            {label}
        </span>
    );
};
