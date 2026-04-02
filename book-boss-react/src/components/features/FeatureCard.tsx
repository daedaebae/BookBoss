import React from 'react';

import { type FeatureRequest } from '../../services/featureService';

interface FeatureCardProps {
    feature: FeatureRequest;
    onVote: (id: number) => void;
    isAdmin: boolean;
    onStatusChange?: (id: number, status: string, admin_note?: string) => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature, onVote, isAdmin, onStatusChange }) => {
    const statusColors: Record<string, string> = {
        open: 'var(--text-secondary)',
        planned: 'var(--accent-color)',
        in_progress: '#3b82f6',
        completed: 'var(--success-color)',
        rejected: 'var(--danger-color)'
    };

    const [isEditing, setIsEditing] = React.useState(false);
    const [note, setNote] = React.useState(feature.admin_note || '');

    const handleSaveNote = () => {
        if (onStatusChange) {
            onStatusChange(feature.id, feature.status, note);
            setIsEditing(false);
        }
    };

    const isFoldableType = feature.status === 'completed' || feature.status === 'rejected';
    const [isFolded, setIsFolded] = React.useState(isFoldableType);

    React.useEffect(() => {
        setIsFolded(feature.status === 'completed' || feature.status === 'rejected');
    }, [feature.status]);

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
            <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: isFoldableType ? 'pointer' : 'default' }}
                onClick={() => isFoldableType && setIsFolded(!isFolded)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>
                        {isFoldableType && (
                            <span style={{ marginRight: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {isFolded ? '▶' : '▼'}
                            </span>
                        )}
                        {feature.title}
                    </h3>
                    {feature.type === 'bug' ? (
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Bug Report</span>
                    ) : (
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-color)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>Feature</span>
                    )}
                    {feature.github_issue_url && (
                        <a href={feature.github_issue_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', border: '1px solid rgba(255, 255, 255, 0.2)', textDecoration: 'none' }}>
                            ⎇ GitHub
                        </a>
                    )}
                </div>
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

            {!isFolded && (
                <>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, flex: 1 }}>
                        {feature.description}
                    </p>

                    {/* Admin Note Section */}
                    {(feature.admin_note || (isAdmin && isEditing)) && (
                        <div style={{
                            marginTop: '8px',
                            padding: '10px',
                            background: 'rgba(255, 255, 0, 0.05)',
                            border: '1px solid rgba(255, 255, 0, 0.2)',
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                        }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--accent-color)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Admin Note:</span>
                                {isAdmin && !isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                                        title="Edit Note"
                                    >
                                        ✎
                                    </button>
                                )}
                            </div>
                            {isEditing ? (
                                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: 'var(--bg-color)',
                                            color: 'var(--text-primary)',
                                            border: 'var(--glass-border)',
                                            borderRadius: '4px',
                                            padding: '6px',
                                            minHeight: '60px'
                                        }}
                                    />
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
                                        <button onClick={handleSaveNote} className="primary-btn small" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>Save</button>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-primary)' }}>{feature.admin_note}</p>
                            )}
                        </div>
                    )}

                    {isAdmin && !feature.admin_note && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            style={{
                                alignSelf: 'flex-start',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                marginBottom: '8px'
                            }}
                        >
                            + Add Admin Note
                        </button>
                    )}

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
                                    onChange={(e) => onStatusChange(feature.id, e.target.value, feature.admin_note)}
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
                </>
            )}
        </div>
    );
};
