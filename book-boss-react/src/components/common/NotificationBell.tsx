import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

interface AppNotification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'motd';
    created_at: string;
}

export const NotificationBell: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        if (!isAuthenticated) return;
        try {
            const token = localStorage.getItem('bookboss_token');
            const res = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const acknowledge = async (id: number) => {
        try {
            const token = localStorage.getItem('bookboss_token');
            await fetch(`/api/notifications/${id}/acknowledge`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to acknowledge notification', error);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                className="secondary-btn"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    width: '42px',
                    height: '42px',
                    position: 'relative'
                }}
                title="Notifications"
            >
                🔔
                {notifications.length > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        background: 'var(--danger-color)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    width: '320px',
                    background: 'var(--glass-bg)',
                    border: 'var(--glass-border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow)',
                    backdropFilter: 'blur(20px)',
                    zIndex: 1000,
                    maxHeight: '400px',
                    overflowY: 'auto',
                    padding: '12px'
                }}>
                    <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--glass-border)', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0 }}>Notifications</h4>
                    </div>

                    {notifications.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                            You're all caught up!
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {notifications.map(n => (
                                <div key={n.id} style={{
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    borderLeft: `4px solid ${n.type === 'warning' ? 'var(--danger-color)' : 'var(--accent-color)'}`
                                }}>
                                    <h5 style={{ margin: '0 0 4px', fontSize: '0.95rem' }}>{n.title}</h5>
                                    <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {n.message}
                                    </p>
                                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />
                                    <button
                                        className="text-btn"
                                        onClick={() => acknowledge(n.id)}
                                        style={{ fontSize: '0.8rem', padding: '4px 8px', margin: 0 }}
                                    >
                                        Acknowledge
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
