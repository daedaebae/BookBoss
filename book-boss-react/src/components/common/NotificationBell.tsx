import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from './Modal';

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

    const [motdModalOpen, setMotdModalOpen] = useState(false);
    const [motdsToShow, setMotdsToShow] = useState<AppNotification[]>([]);

    const getColorForType = (type: string) => {
        switch (type) {
            case 'success': return 'var(--success-color, #10b981)';
            case 'warning': return 'var(--danger-color)';
            case 'info': return 'var(--warning-color, #eab308)';
            case 'motd': return 'var(--accent-color)';
            default: return 'var(--accent-color)';
        }
    };

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

        // Listen for internal broadcasts
        const handleUpdate = () => fetchNotifications();
        window.addEventListener('notificationsUpdated', handleUpdate);

        return () => {
            clearInterval(interval);
            window.removeEventListener('notificationsUpdated', handleUpdate);
        };
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

    useEffect(() => {
        if (notifications.length > 0) {
            const motds = notifications.filter(n => n.type === 'motd');
            if (motds.length > 0) {
                const storedValue = sessionStorage.getItem('bookboss_motds_shown');
                let shownIds: number[] = [];
                try {
                    shownIds = storedValue ? JSON.parse(storedValue) : [];
                } catch (e) { }

                const newMotds = motds.filter(m => !shownIds.includes(m.id));
                if (newMotds.length > 0) {
                    setMotdsToShow(newMotds);
                    setMotdModalOpen(true);

                    const updatedIds = [...shownIds, ...newMotds.map(m => m.id)];
                    sessionStorage.setItem('bookboss_motds_shown', JSON.stringify(updatedIds));
                }
            }
        }
    }, [notifications]);

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
                                    borderLeft: `4px solid ${getColorForType(n.type)}`
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

            <Modal
                isOpen={motdModalOpen}
                onClose={() => setMotdModalOpen(false)}
                title="Message of the Day"
                maxWidth="500px"
            >
                {motdsToShow.map(m => (
                    <div key={m.id} style={{
                        padding: '15px',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        marginBottom: '15px',
                        borderLeft: `4px solid ${getColorForType('motd')}`
                    }}>
                        <h4 style={{ margin: '0 0 10px', color: 'var(--text-color)' }}>{m.title}</h4>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            {m.message}
                        </p>
                        <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '15px 0' }} />
                        <button
                            className="primary-btn small"
                            onClick={() => {
                                acknowledge(m.id);
                                setMotdsToShow(prev => prev.filter(motd => motd.id !== m.id));
                                if (motdsToShow.length <= 1) {
                                    setMotdModalOpen(false);
                                }
                            }}
                            style={{ margin: 0 }}
                        >
                            Understood
                        </button>
                    </div>
                ))}
            </Modal>
        </div>
    );
};
