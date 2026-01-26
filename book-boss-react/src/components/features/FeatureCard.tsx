import React from 'react';

interface FeatureRequest {
    id: number;
    title: string;
    description: string;
    status: 'open' | 'planned' | 'in_progress' | 'completed' | 'rejected';
    vote_count: number;
    voted_by_me: boolean;
    created_by: string;
    created_at: string;
}

interface FeatureCardProps {
    feature: FeatureRequest;
    onVote: (id: number) => void;
    isAdmin: boolean;
    onStatusChange?: (id: number, status: string) => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature, onVote, isAdmin, onStatusChange }) => {
    const statusColors: Record<string, string> = {
        open: 'var(--text-secondary)',
        planned: 'var(--accent-color)',
        in_progress: '#3b82f6',
        completed: 'var(--success-color)',
        rejected: 'var(--danger-color)'
    };

    return (
        <div style={{
            background: 'var(--card-bg)',
            border: 'var(--glass-border)',
            borderRadius: 'var(--radius)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            position: 'relative'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>{feature.title}</h3>
                <span style={{
                    fontSize: '0.8rem',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: `${statusColors[feature.status]}20`, // 20% opacity
                    color: statusColors[feature.status],
                    border: `1px solid ${statusColors[feature.status]}50`,
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                }}>
                    {feature.status.replace('_', ' ')}
                </span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, flex: 1 }}>
                {feature.description}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>By {feature.created_by}</span>
                    <span>•</span>
                    <span>{new Date(feature.created_at).toLocaleDateString()}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isAdmin && onStatusChange && (
                        <select
                            value={feature.status}
                            onChange={(e) => onStatusChange(feature.id, e.target.value)}
                            style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: 'var(--bg-color)',
                                color: 'var(--text-primary)',
                                border: 'var(--glass-border)',
                                fontSize: '0.8rem'
                            }}
                        >
                            <option value="open">Open</option>
                            <option value="planned">Planned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    )}

                    <button
                        onClick={() => onVote(feature.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            border: feature.voted_by_me ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)',
                            background: feature.voted_by_me ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                            color: feature.voted_by_me ? 'var(--accent-color)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ fontSize: '1.1rem' }}>▲</span>
                        <span style={{ fontWeight: 'bold' }}>{feature.vote_count}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
