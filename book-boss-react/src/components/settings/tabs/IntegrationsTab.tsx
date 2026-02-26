import React, { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings } from '../../../hooks/queries/useSettings';
import { Toast } from '../../common/Toast';

export const IntegrationsTab: React.FC = () => {
    const { data: settings, isLoading } = useSettings();
    const updateSettingsMut = useUpdateSettings();

    const [githubEnabled, setGithubEnabled] = useState(false);
    const [githubRepo, setGithubRepo] = useState('daedaebae/bookboss');
    const [githubToken, setGithubToken] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
        message: '', type: 'info', isVisible: false
    });

    useEffect(() => {
        if (settings) {
            setGithubEnabled(settings.github_enabled === 'true' || settings.github_enabled === true);
            if (settings.github_repo) setGithubRepo(settings.github_repo);
            if (settings.github_token) setGithubToken(settings.github_token);
        }
    }, [settings]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type, isVisible: true });
    };

    const updateIntegrationSettings = async (updates: any) => {
        try {
            await updateSettingsMut.mutateAsync(updates);
            showToast('Integration settings saved successfully', 'success');
        } catch (error) {
            showToast('Failed to save integration settings', 'error');
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                <h4>GitHub Integration</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>
                    Connect your BookBoss instance to a GitHub repository to track feature requests as issues.
                </p>

                <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <label style={{ marginBottom: 0, fontWeight: 600 }}>Enable GitHub Feature Sync</label>
                    <input
                        type="checkbox"
                        checked={githubEnabled}
                        onChange={(e) => {
                            const val = e.target.checked;
                            setGithubEnabled(val);
                            updateIntegrationSettings({ github_enabled: val.toString() });
                        }}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                </div>

                <div className="form-group" style={{ opacity: githubEnabled ? 1 : 0.5, pointerEvents: githubEnabled ? 'auto' : 'none' }}>
                    <label>GitHub Repository (e.g. daedaebae/bookboss)</label>
                    <input
                        type="text"
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        onBlur={(e) => updateIntegrationSettings({ github_repo: e.target.value })}
                        placeholder="user/repo"
                        className="form-input"
                        style={{ width: '100%' }}
                    />
                </div>

                <div className="form-group" style={{ opacity: githubEnabled ? 1 : 0.5, pointerEvents: githubEnabled ? 'auto' : 'none' }}>
                    <label>GitHub Personal Access Token (PAT)</label>
                    <input
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        onBlur={(e) => updateIntegrationSettings({ github_token: e.target.value })}
                        placeholder="ghp_xxxxxxxxxxxx"
                        className="form-input"
                        style={{ width: '100%' }}
                    />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                        Requires `repo` access to create/update issues.
                    </p>
                </div>
            </div>
            {toast.isVisible && <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} />}
        </div>
    );
};
