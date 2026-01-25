import React, { useEffect, useState } from 'react';
import { bookService } from '../../services/bookService';

interface Job {
    id: number;
    type: string;
    description: string;
    status: 'running' | 'completed' | 'failed';
    progress: number;
    total: number;
    processed: number;
    message?: string;
}

export const JobIndicator: React.FC = () => {
    const [activeJob, setActiveJob] = useState<Job | null>(null);

    useEffect(() => {
        const checkJobs = async () => {
            try {
                const jobs = await bookService.getJobs();
                // Find first running job
                const running = jobs.find((j: Job) => j.status === 'running');
                setActiveJob(running || null);
            } catch (error) {
                // Silently fail to not annoy user
                console.warn('Failed to check jobs', error);
            }
        };

        // Check immediately
        checkJobs();

        // Poll every 2 seconds
        const interval = setInterval(checkJobs, 2000);
        return () => clearInterval(interval);
    }, []);

    if (!activeJob) return null;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--card-bg)',
            padding: '6px 12px',
            borderRadius: '20px',
            border: '1px solid var(--accent-color)',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
            <div className="spinner" style={{
                width: '14px',
                height: '14px',
                border: '2px solid var(--accent-color)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600 }}>{activeJob.description}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    {activeJob.message || `${activeJob.progress}%`}
                </span>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
