import React from 'react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    gradientFrom: string;
    gradientTo: string;
    onClick?: () => void;
    loading?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    icon,
    color,
    gradientFrom,
    gradientTo,
    onClick,
    loading = false
}) => {
    return (
        <div
            style={{
                background: 'white',
                borderRadius: '14px',
                padding: '1.25rem 1.5rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.04)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: onClick ? 'pointer' : 'default',
            }}
            onClick={onClick}
            onMouseEnter={(e) => {
                if (onClick) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)';
                }
            }}
            onMouseLeave={(e) => {
                if (onClick) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                }
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <p style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        color: '#9ca3af',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        {title}
                    </p>
                    <p style={{
                        margin: '0.35rem 0 0',
                        fontSize: '2rem',
                        fontWeight: '800',
                        color: color,
                        lineHeight: 1
                    }}>
                        {loading ? '...' : value}
                    </p>
                </div>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    color: 'white' // Ensure icon is readable on gradient
                }}>
                    {icon}
                </div>
            </div>
        </div>
    );
};
