import React, { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings } from '../../../hooks/queries/useSettings';
import { Toast } from '../../common/Toast';
import { absService } from '../../../services/absService';
import { settingsService } from '../../../services/settingsService';
import { ConfirmationModal } from '../../common/ConfirmationModal';
import LogViewerModal from '../../common/LogViewerModal';

export const IntegrationsTab: React.FC = () => {
    const { data: settings, isLoading } = useSettings();
    const updateSettingsMut = useUpdateSettings();

    // GitHub Settings
    const [githubEnabled, setGithubEnabled] = useState(false);
    const [githubRepo, setGithubRepo] = useState('daedaebae/BookBoss');
    const [githubToken, setGithubToken] = useState('');

    // Ntfy Settings
    const [ntfyEnabled, setNtfyEnabled] = useState(false);
    const [ntfyServerUrl, setNtfyServerUrl] = useState('https://ntfy.sh');
    const [ntfyTopic, setNtfyTopic] = useState('');
    const [ntfySaId, setNtfySaId] = useState('');
    const [ntfySaSecret, setNtfySaSecret] = useState('');

    // Visibility States
    const [showGithubToken, setShowGithubToken] = useState(false);
    const [showNtfySecret, setShowNtfySecret] = useState(false);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
        message: '', type: 'info', isVisible: false
    });

    const [ignoreEnv, setIgnoreEnv] = useState(false);
    const [hasEnvVars, setHasEnvVars] = useState(false);

    // ABS servers (admin only)
    const [absServers, setAbsServers] = useState<any[]>([]);
    const [showAddServer, setShowAddServer] = useState(false);
    const [newServerName, setNewServerName] = useState('');
    const [newServerUrl, setNewServerUrl] = useState('');
    const [newServerApiKey, setNewServerApiKey] = useState('');
    const [isEditingServer, setIsEditingServer] = useState(false);
    const [editingServerId, setEditingServerId] = useState<number | null>(null);
    const [showNewServerApiKey, setShowNewServerApiKey] = useState(false);
    const [syncingServerId, setSyncingServerId] = useState<number | null>(null);

    const [debugMode, setDebugMode] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isDanger?: boolean }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const openConfirm = (title: string, message: string, onConfirm: () => void, isDanger = false) => {
        setConfirmModal({ isOpen: true, title, message, onConfirm, isDanger });
    };

    useEffect(() => {
        fetchAbsServers();
        const storedDebug = localStorage.getItem('bookboss_debug_mode');
        if (storedDebug) {
            setDebugMode(storedDebug === 'true');
        }
    }, []);

    const fetchAbsServers = async () => {
        try {
            const data = await settingsService.getAbsServers();
            setAbsServers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch ABS servers:', error);
            setAbsServers([]);
        }
    };

    const handleConnectServer = async () => {
        // Validation: Name and URL always required. API Key required for new, optional for edit.
        if (!newServerName || !newServerUrl || (!isEditingServer && !newServerApiKey)) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            if (isEditingServer && editingServerId) {
                await settingsService.updateAbsServer(editingServerId, {
                    server_name: newServerName,
                    server_url: newServerUrl,
                    api_key: newServerApiKey, // Optional if empty
                    is_active: true // default to active on edit for now
                });
                showToast('Server updated successfully!', 'success');
            } else {
                await settingsService.addAbsServer({
                    server_name: newServerName,
                    server_url: newServerUrl,
                    api_key: newServerApiKey
                });
                showToast('Server connected successfully!', 'success');
            }
            closeServerForm();
            fetchAbsServers();
        } catch (error: any) {
            console.error('Failed to save server:', error);
            showToast(`Failed to connect: ${error.message || 'Unknown error'}`, 'error');
        }
    };

    const handleTestServer = async (server: any) => {
        try {
            const result = await settingsService.testAbsServer(server.id);
            if (result.status === 'connected') {
                showToast(`Connection Successful! User: ${result.info.username}`, 'success');
            } else {
                showToast('Connection Failed', 'error');
            }
        } catch (error: any) {
            console.error('Test failed:', error);
            showToast(`Test Failed: ${error.response?.data?.error || error.message}`, 'error');
        }
    };

    const handleDeleteServer = async (server: any) => {
        openConfirm(
            'Remove Server',
            `Are you sure you want to remove "${server.server_name}"?`,
            async () => {
                try {
                    await settingsService.deleteAbsServer(server.id);
                    showToast('Server removed', 'success');
                    fetchAbsServers();
                } catch (error: any) {
                    console.error('Delete failed:', error);
                    showToast('Failed to remove server', 'error');
                }
            },
            true
        );
    };

    const startEditServer = (server: any) => {
        setNewServerName(server.server_name);
        setNewServerUrl(server.server_url);
        setNewServerApiKey(''); // Don't show existing key
        setEditingServerId(server.id);
        setIsEditingServer(true);
        setShowAddServer(true);
    };

    const closeServerForm = () => {
        setShowAddServer(false);
        setIsEditingServer(false);
        setEditingServerId(null);
        setNewServerName('');
        setNewServerUrl('');
        setNewServerApiKey('');
    };

    const handleSync = async (server: any) => {
        openConfirm(
            'Sync Library',
            `Sync entire library from "${server.server_name}"? This might take a minute.`,
            async () => {
                setSyncingServerId(server.id);
                try {
                    const result = await absService.syncLibrary(server.id, '', debugMode);

                    if (debugMode && result.logs) {
                        setLogs(result.logs);
                        setShowLogs(true);
                    } else {
                        showToast(`Sync Complete! Imported: ${result.stats.imported}, Linked: ${result.stats.linked}, Skipped: ${result.stats.skipped}, Errors: ${result.stats.errors}`, 'success');
                    }
                } catch (error: any) {
                    console.error('Sync failed:', error);
                    if (debugMode && error.response?.data?.logs) {
                        setLogs(error.response.data.logs);
                        setShowLogs(true);
                    }
                    showToast(`Sync Failed: ${error.response?.data?.error || error.message}`, 'error');
                } finally {
                    setSyncingServerId(null);
                }
            }
        );
    };

    useEffect(() => {
        if (settings) {
            setIgnoreEnv(settings.ignore_env_integrations === 'true');
            if (settings._env) {
                setHasEnvVars(settings._env.has_github || settings._env.has_ntfy);
            }

            setGithubEnabled(settings.github_enabled === 'true' || settings.github_enabled === true);
            if (settings.github_repo) setGithubRepo(settings.github_repo);
            if (settings.github_token) setGithubToken(settings.github_token);

            setNtfyEnabled(settings.ntfy_enabled === 'true' || settings.ntfy_enabled === true);
            if (settings.ntfy_server_url) setNtfyServerUrl(settings.ntfy_server_url);
            if (settings.ntfy_topic) setNtfyTopic(settings.ntfy_topic);
            if (settings.ntfy_sa_id) setNtfySaId(settings.ntfy_sa_id);
            if (settings.ntfy_sa_secret) setNtfySaSecret(settings.ntfy_sa_secret);
        }
    }, [settings]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type, isVisible: true });
    };

    const updateIntegrationSettings = async (updates: any) => {
        try {
            await updateSettingsMut.mutateAsync(updates);
            showToast('Integration settings saved successfully', 'success');
        } catch {
            showToast('Failed to save integration settings', 'error');
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            {hasEnvVars && !ignoreEnv && (
                <div style={{ padding: '15px', marginBottom: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h4 style={{ margin: '0 0 5px 0', color: 'var(--danger-color)' }}>Environment Integrations Active</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Some integrations are currently configured via Docker Compose environment variables.
                        </p>
                    </div>
                    <button
                        className="secondary-btn small danger"
                        onClick={() => {
                            updateIntegrationSettings({ ignore_env_integrations: 'true' });
                            setIgnoreEnv(true);
                        }}
                    >
                        Remove Env Integrations
                    </button>
                </div>
            )}

            {hasEnvVars && ignoreEnv && (
                <div style={{ padding: '15px', marginBottom: '20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#10b981' }}>Environment Integrations Ignored</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Docker Compose environment variables are currently being ignored.
                        </p>
                    </div>
                    <button
                        className="secondary-btn small"
                        onClick={() => {
                            updateIntegrationSettings({ ignore_env_integrations: 'false' });
                            setIgnoreEnv(false);
                        }}
                    >
                        Restore Env Integrations
                    </button>
                </div>
            )}

            {/* Audiobookshelf Section */}
            <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4>Audiobookshelf Integration</h4>
                    {!showAddServer && (
                        <button className="secondary-btn small" onClick={() => { closeServerForm(); setShowAddServer(true); }}>
                            + Add Server
                        </button>
                    )}
                </div>

                {showAddServer && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                        <h4>{isEditingServer ? 'Edit Server' : 'Connect New Server'}</h4>
                        <div className="form-group">
                            <label>Server Name</label>
                            <input
                                type="text"
                                placeholder="My Audiobooks"
                                value={newServerName}
                                onChange={(e) => setNewServerName(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Server URL</label>
                            <input
                                type="url"
                                placeholder="http://localhost:13378"
                                value={newServerUrl}
                                onChange={(e) => setNewServerUrl(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>API Key {isEditingServer && <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>(Leave blank to keep unchanged)</span>}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showNewServerApiKey ? "text" : "password"}
                                    placeholder={isEditingServer ? "Enter new API Key to update" : "Paste API Key here"}
                                    value={newServerApiKey}
                                    onChange={(e) => setNewServerApiKey(e.target.value)}
                                    style={{ paddingRight: '40px', width: '100%' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewServerApiKey(!showNewServerApiKey)}
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                    title={showNewServerApiKey ? "Hide Key" : "Show Key"}
                                >
                                    {showNewServerApiKey ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="primary-btn small" onClick={handleConnectServer}>{isEditingServer ? 'Update' : 'Connect'}</button>
                            <button className="secondary-btn small" onClick={closeServerForm}>Cancel</button>
                        </div>
                    </div>
                )}

                <div className="server-grid">
                    {absServers.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px', gridColumn: '1 / -1' }}>
                            No servers connected.
                        </p>
                    ) : (
                        absServers.map((server: any) => (
                            <div key={server.id} className="server-card">
                                <div className="server-card-header">
                                    <div className="server-info">
                                        <h4>{server.server_name}</h4>
                                        <span className="server-url">{server.server_url}</span>
                                    </div>
                                    <div className={`status-badge ${server.is_active ? 'active' : 'inactive'}`}>
                                        {server.is_active ? 'Active' : 'Inactive'}
                                    </div>
                                </div>

                                <div className="server-card-actions">
                                    <button
                                        onClick={() => handleSync(server)}
                                        className="secondary-btn small"
                                        disabled={syncingServerId === server.id}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        {syncingServerId === server.id ? (
                                            <>
                                                <span className="spinner-small"></span> Syncing...
                                            </>
                                        ) : (
                                            'Sync'
                                        )}
                                    </button>
                                    <button onClick={() => handleTestServer(server)} className="secondary-btn small">
                                        Test
                                    </button>
                                    <button onClick={() => startEditServer(server)} className="secondary-btn small">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDeleteServer(server)} className="secondary-btn small danger">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* GitHub Section */}
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
                    <label>GitHub Repository (e.g. daedaebae/BookBoss)</label>
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
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showGithubToken ? "text" : "password"}
                            value={githubToken}
                            onChange={(e) => setGithubToken(e.target.value)}
                            onBlur={(e) => updateIntegrationSettings({ github_token: e.target.value })}
                            placeholder="ghp_xxxxxxxxxxxx"
                            className="form-input"
                            style={{ width: '100%', paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowGithubToken(!showGithubToken)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '4px'
                            }}
                            title={showGithubToken ? "Hide Token" : "Reveal Token"}
                        >
                            {showGithubToken ? '🙈' : '👁️'}
                        </button>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                        Requires `repo` access to create/update issues.
                    </p>
                </div>
            </div>

            {/* Ntfy Section */}
            <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                <h4>Push Notifications (Ntfy)</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>
                    Configure a Ntfy instance to receive push notifications for events like new feature requests.
                </p>

                <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <label style={{ marginBottom: 0, fontWeight: 600 }}>Enable Ntfy Notifications</label>
                    <input
                        type="checkbox"
                        checked={ntfyEnabled}
                        onChange={(e) => {
                            const val = e.target.checked;
                            setNtfyEnabled(val);
                            updateIntegrationSettings({ ntfy_enabled: val.toString() });
                        }}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                </div>

                <div className="form-group" style={{ opacity: ntfyEnabled ? 1 : 0.5, pointerEvents: ntfyEnabled ? 'auto' : 'none' }}>
                    <label>Ntfy Server URL</label>
                    <input
                        type="text"
                        value={ntfyServerUrl}
                        onChange={(e) => setNtfyServerUrl(e.target.value)}
                        onBlur={(e) => updateIntegrationSettings({ ntfy_server_url: e.target.value })}
                        placeholder="https://ntfy.sh"
                        className="form-input"
                        style={{ width: '100%' }}
                    />
                </div>

                <div className="form-group" style={{ opacity: ntfyEnabled ? 1 : 0.5, pointerEvents: ntfyEnabled ? 'auto' : 'none' }}>
                    <label>Topic Name</label>
                    <input
                        type="text"
                        value={ntfyTopic}
                        onChange={(e) => setNtfyTopic(e.target.value)}
                        onBlur={(e) => updateIntegrationSettings({ ntfy_topic: e.target.value })}
                        placeholder="bookboss_notifications"
                        className="form-input"
                        style={{ width: '100%' }}
                    />
                </div>

                <details style={{ opacity: ntfyEnabled ? 1 : 0.5, pointerEvents: ntfyEnabled ? 'auto' : 'none' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>Advanced: Service Authentication</summary>
                    <div style={{ paddingLeft: '10px', marginTop: '10px', borderLeft: '2px solid var(--glass-border)' }}>
                        <div className="form-group">
                            <label>Service Auth ID Header (e.g. CF-Access-Client-Id: your-id)</label>
                            <input
                                type="text"
                                value={ntfySaId}
                                onChange={(e) => setNtfySaId(e.target.value)}
                                onBlur={(e) => updateIntegrationSettings({ ntfy_sa_id: e.target.value })}
                                placeholder="Header-Name: Value"
                                className="form-input"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Service Auth Secret Header (e.g. CF-Access-Client-Secret: your-secret)</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showNtfySecret ? "text" : "password"}
                                    value={ntfySaSecret}
                                    onChange={(e) => setNtfySaSecret(e.target.value)}
                                    onBlur={(e) => updateIntegrationSettings({ ntfy_sa_secret: e.target.value })}
                                    placeholder="Header-Name: Value"
                                    className="form-input"
                                    style={{ width: '100%', paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNtfySecret(!showNtfySecret)}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        padding: '4px'
                                    }}
                                    title={showNtfySecret ? "Hide Secret" : "Reveal Secret"}
                                >
                                    {showNtfySecret ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                    </div>
                </details>
            </div>

            {toast.isVisible && <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} />}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isDanger={confirmModal.isDanger}
            />

            <LogViewerModal
                isOpen={showLogs}
                onClose={() => setShowLogs(false)}
                logs={logs}
            />
        </div>
    );
};
