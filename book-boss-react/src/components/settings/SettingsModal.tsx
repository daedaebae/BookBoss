import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Toast } from '../common/Toast';
import { ConfirmationModal } from '../common/ConfirmationModal';
import LogViewerModal from '../common/LogViewerModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { exportService } from '../../services/exportService';
import { userService } from '../../services/userService';
import { settingsService } from '../../services/settingsService';
import { absService } from '../../services/absService';
import { MetadataRefreshModal } from '../books/MetadataRefreshModal';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSettingsChange?: () => void;
}

type SettingsTab = 'general' | 'profile' | 'filters' | 'export' | 'users' | 'audiobookshelf' | 'backup';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSettingsChange }) => {
    const { user } = useAuth();
    const { setAccentColor: setGlobalAccentColor } = useTheme();
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    // General settings
    const [accentColor, setAccentColor] = useState('theme-purple');
    const [allowRegistration, setAllowRegistration] = useState(false);
    const [debugMode, setDebugMode] = useState(false);

    // Logging
    const [showLogs, setShowLogs] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    // Profile settings
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [privacySettings, setPrivacySettings] = useState<{
        share_library: boolean;
        library_name?: string;
        share_shelves: boolean;
        share_progress: boolean;
    }>({
        share_library: false,
        library_name: '',
        share_shelves: false,
        share_progress: false
    });

    // ... (inside render, profile tab)

    <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
        <h4>Privacy Settings</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>
            Control what you share with other users on this server.
        </p>

        <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ marginBottom: 0, fontWeight: 600 }}>Share my library</label>
            <input
                type="checkbox"
                checked={privacySettings.share_library}
                onChange={(e) => updatePrivacySettings({ ...privacySettings, share_library: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '-10px', marginBottom: '15px' }}>
            If disabled, your library is completely hidden from other users.
        </p>

        <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: privacySettings.share_library ? 1 : 0.5 }}>
            <label style={{ marginBottom: 0 }}>Share my shelves with other users</label>
            <input
                type="checkbox"
                checked={privacySettings.share_shelves}
                disabled={!privacySettings.share_library}
                onChange={(e) => updatePrivacySettings({ ...privacySettings, share_shelves: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: privacySettings.share_library ? 'pointer' : 'not-allowed' }}
            />
        </div>
        <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: privacySettings.share_library ? 1 : 0.5 }}>
            <label style={{ marginBottom: 0 }}>Share my reading progress and status</label>
            <input
                type="checkbox"
                checked={privacySettings.share_progress}
                disabled={!privacySettings.share_library}
                onChange={(e) => updatePrivacySettings({ ...privacySettings, share_progress: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: privacySettings.share_library ? 'pointer' : 'not-allowed' }}
            />
        </div>
    </div>

    // Filter settings
    const [defaultSort, setDefaultSort] = useState('added_desc');

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
        message: '',
        type: 'info',
        isVisible: false
    });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type, isVisible: true });
    };

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



    // Users (admin only)
    const [users, setUsers] = useState<any[]>([]);
    const [usersError, setUsersError] = useState<string | null>(null);
    const [showAddUser, setShowAddUser] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null); // New state for editing
    const [newUsername, setNewUsername] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);

    // ABS servers (admin only)
    const [absServers, setAbsServers] = useState<any[]>([]);
    const [showAddServer, setShowAddServer] = useState(false);
    const [newServerName, setNewServerName] = useState('');
    const [newServerUrl, setNewServerUrl] = useState('');
    const [newServerApiKey, setNewServerApiKey] = useState('');
    const [isEditingServer, setIsEditingServer] = useState(false);
    const [editingServerId, setEditingServerId] = useState<number | null>(null);
    const [syncingServerId, setSyncingServerId] = useState<number | null>(null);

    // ... (existing code)

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
                alert('Server updated successfully!');
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

    // ... (inside render)

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

    // Metadata refresh state
    const [isMetadataRefreshOpen, setIsMetadataRefreshOpen] = useState(false);

    // Backup & Restore
    const [backupStatus, setBackupStatus] = useState('');
    const [isRestoring, setIsRestoring] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
            if (user?.is_admin) {
                fetchUsers();
                fetchAbsServers();
            }
            // Set initial tab based on user role
            if (!user?.is_admin && activeTab === 'general') {
                setActiveTab('profile');
            }
            fetchUserProfile();
        }
    }, [isOpen, user]);

    const fetchUserProfile = async () => {
        try {
            const profile = await userService.getProfile();
            if (profile.privacy_settings) {
                setPrivacySettings(profile.privacy_settings);
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
        }
    };

    const fetchSettings = async () => {
        try {
            const settings = await settingsService.getSettings();
            if (settings.accent_color) {
                setAccentColor(settings.accent_color);
                setGlobalAccentColor(settings.accent_color);
            }
            if (settings.allow_registration !== undefined) {
                setAllowRegistration(settings.allow_registration === 'true' || settings.allow_registration === true);
            }
            const storedDebug = localStorage.getItem('bookboss_debug_mode');
            if (storedDebug) {
                setDebugMode(storedDebug === 'true');
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        }
    };

    const updateGeneralSettings = async (updates: { accent_color?: string; allow_registration?: string }) => {
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('bookboss_token')}`
                },
                body: JSON.stringify({
                    accent_color: updates.accent_color !== undefined ? updates.accent_color : accentColor,
                    allow_registration: updates.allow_registration !== undefined ? updates.allow_registration : allowRegistration.toString()
                })
            });

            if (updates.accent_color) {
                setGlobalAccentColor(updates.accent_color);
            }
            // Optional: show a small toast or indicator
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    };

    const handleAccentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVal = e.target.value;
        setAccentColor(newVal);
        updateGeneralSettings({ accent_color: newVal });
    };

    const handleRegistrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.checked;
        setAllowRegistration(newVal);
        updateGeneralSettings({ allow_registration: newVal.toString() });
    };

    const handleDebugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.checked;
        setDebugMode(newVal);
        localStorage.setItem('bookboss_debug_mode', String(newVal));
    };

    /**
     * Fetches the list of users from the API
     * Requires admin authentication
     */
    const fetchUsers = async () => {
        try {
            // Use Admin Libraries endpoint to get stats + users
            const token = localStorage.getItem('bookboss_token');
            const response = await fetch('/api/admin/libraries', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setUsers(Array.isArray(data) ? data : []);
            setUsersError(null);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setUsersError('Failed to load users.');
            setUsers([]);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername || !newUserPassword) {
            showToast('Username and password required', 'error');
            return;
        }
        try {
            await userService.createUser({
                username: newUsername,
                password: newUserPassword,
                is_admin: newUserIsAdmin
            });
            alert('User created successfully!');
            setShowAddUser(false);
            setNewUsername('');
            setNewUserPassword('');
            setNewUserIsAdmin(false);
            fetchUsers();
        } catch (error) {
            console.error('Failed to create user:', error);
            alert('Failed to create user');
        }
    };

    const startEditingUser = (userToEdit: any) => {
        setEditingUser(userToEdit);
        setNewUsername(userToEdit.username);
        setNewUserPassword(''); // Don't show existing password
        setNewUserIsAdmin(userToEdit.is_admin);
        setShowAddUser(true); // Reuse the add user form
    };

    const updateUser = async () => {
        if (!newUsername) {
            alert('Username is required');
            return;
        }
        try {
            const body: any = {
                username: newUsername,
                is_admin: newUserIsAdmin
            };
            if (newUserPassword) {
                body.password = newUserPassword;
            }

            await userService.updateUser(editingUser.id, body);

            showToast('User updated successfully!', 'success');
            setEditingUser(null);
            setShowAddUser(false);
            setNewUsername('');
            setNewUserPassword('');
            setNewUserIsAdmin(false);
            fetchUsers();
        } catch (error) {
            console.error('Failed to update user:', error);
            showToast('Failed to update user', 'error');
        }
    };

    const cancelEdit = () => {
        setEditingUser(null);
        setShowAddUser(false);
        setNewUsername('');
        setNewUserPassword('');
        setNewUserIsAdmin(false);
    };

    const deleteUser = async () => {
        if (!userToDelete) return;
        try {
            await userService.deleteUser(userToDelete.id);
            showToast('User deleted successfully', 'success');
            setUserToDelete(null);
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user:', error);
            showToast('Failed to delete user', 'error');
        } finally {
            setUserToDelete(null);
        }
    };

    const fetchAbsServers = async () => {
        try {
            const data = await settingsService.getAbsServers();
            setAbsServers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch ABS servers:', error);
            setAbsServers([]);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        if (!user) return;

        try {
            await userService.updateProfile({ password: newPassword });
            showToast('Password updated successfully', 'success');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Failed to update password:', error);
            showToast('Failed to update password', 'error');
        }
    };

    const updatePrivacySettings = async (newSettings: any) => {
        setPrivacySettings(newSettings);
        try {
            await userService.updateProfile({ privacy_settings: newSettings });
            if (onSettingsChange) {
                console.log('Refreshing settings/libraries via callback...');
                onSettingsChange();
            }
        } catch (error) {
            console.error('Failed to save privacy settings:', error);
        }
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setDefaultSort(val);
        localStorage.setItem('bookboss_sort', val);
    };





    const handleExportCSV = async () => {
        try {
            await exportService.exportCSV();
            showToast('Library exported as CSV!', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            showToast('Failed to export library as CSV', 'error');
        }
    };

    const handleExportJSON = async () => {
        try {
            await exportService.exportJSON();
            showToast('Library exported as JSON!', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            showToast('Failed to export library as JSON', 'error');
        }
    };

    const handleBackup = async () => {
        try {
            await exportService.createBackup();
            setBackupStatus('Backup created successfully!');
            setTimeout(() => setBackupStatus(''), 3000);
        } catch (error: any) {
            console.error('Backup failed:', error);
            setBackupStatus(`Backup failed: ${error.message}. Please try again.`);
        }
    };

    const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        openConfirm(
            'Restore Database',
            'WARNING: Restoring from a backup will OVERWRITE all current data. This action cannot be undone. Are you sure you want to proceed?',
            async () => {
                setIsRestoring(true);
                setBackupStatus('Restoring database... please wait.');

                try {
                    await exportService.restoreBackup(file);
                    setBackupStatus('Database restored successfully! Please refresh the page.');
                    showToast('Database restored successfully!', 'success');
                    setTimeout(() => window.location.reload(), 2000);
                } catch (error: any) {
                    console.error('Restore failed:', error);
                    setBackupStatus(`Restore failed: ${error.message}. Please check the file and try again.`);
                    showToast(`Restore failed: ${error.message}`, 'error');
                } finally {
                    setIsRestoring(false);
                }
            },
            true
        );
    };

    const tabs = [
        { id: 'general' as SettingsTab, label: 'General', adminOnly: true },
        { id: 'profile' as SettingsTab, label: 'Profile', adminOnly: false },
        { id: 'filters' as SettingsTab, label: 'Filters', adminOnly: false },
        { id: 'export' as SettingsTab, label: 'Export', adminOnly: false },
        { id: 'users' as SettingsTab, label: 'Users', adminOnly: true },
        { id: 'audiobookshelf' as SettingsTab, label: 'Audiobookshelf', adminOnly: true },
        { id: 'backup' as SettingsTab, label: 'Backup & Restore', adminOnly: true },
    ];

    const visibleTabs = tabs.filter(tab => !tab.adminOnly || user?.is_admin);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings (Dev Mode)" maxWidth="800px">
            <div className="settings-layout">
                {/* Sidebar */}
                {/* Sidebar Navigation 
                    Refactored to a horizontal scrollable tab bar for universal layout (desktop & mobile).
                    Includes left/right scroll arrows for better accessibilty on smaller screens.
                */}
                <aside className="settings-sidebar">
                    <button
                        className="settings-scroll-btn left"
                        onClick={() => {
                            const container = document.querySelector('.settings-tabs-scroll-area');
                            if (container) container.scrollBy({ left: -100, behavior: 'smooth' });
                        }}
                        aria-label="Scroll Left"
                    >
                        ‹
                    </button>
                    <div className="settings-tabs-scroll-area">
                        {visibleTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                        {user?.is_admin && debugMode && (
                            <button
                                onClick={() => setActiveTab('debug' as any)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: '100%',
                                    padding: '0 16px',
                                    background: activeTab === ('debug' as any) ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                    border: 'none',
                                    borderBottom: activeTab === ('debug' as any) ? '2px solid var(--danger-color)' : '2px solid transparent',
                                    color: 'var(--danger-color)',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                🐞 Debug
                            </button>
                        )}
                    </div>
                    <button
                        className="settings-scroll-btn right"
                        onClick={() => {
                            const container = document.querySelector('.settings-tabs-scroll-area');
                            if (container) container.scrollBy({ left: 100, behavior: 'smooth' });
                        }}
                        aria-label="Scroll Right"
                    >
                        ›
                    </button>
                </aside>

                {/* Content */}
                <main className="settings-body">
                    {activeTab === 'general' && user?.is_admin && (
                        <div>

                            <div className="form-group">
                                <label>Accent Color / Theme</label>
                                <select value={accentColor} onChange={handleAccentChange}>
                                    <option value="theme-purple">Purple (Default)</option>
                                    <option value="theme-blue">Blue</option>
                                    <option value="theme-green">Green</option>
                                    <option value="theme-orange">Orange</option>
                                    <option value="theme-pink">Pink</option>
                                    <option value="theme-midnight">Midnight</option>
                                    <option value="theme-forest">Forest</option>
                                    <option value="theme-sunset">Sunset</option>
                                    <option value="theme-ocean">Ocean</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ marginBottom: 0 }}>Allow Public Registration</label>
                                <input
                                    type="checkbox"
                                    checked={allowRegistration}
                                    onChange={handleRegistrationChange}
                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Library Maintenance</label>

                                {privacySettings.share_library && (
                                    <></>
                                )}
                                <button
                                    className="secondary-btn"
                                    onClick={() => setIsMetadataRefreshOpen(true)}
                                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '10px' }}
                                >
                                    🔄 Sync Metadata & Covers
                                </button>

                                <button
                                    className="secondary-btn"
                                    onClick={() => setActiveTab('users')}
                                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                                >
                                    👥 Manage User Libraries
                                </button>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                                    View usage stats and wipe libraries in the Users tab.
                                </p>
                            </div>
                            <div className="form-group">
                                <label>System Backup</label>
                                <button
                                    className="secondary-btn"
                                    onClick={handleBackup}
                                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                                >
                                    ⬇️ Create Database Backup
                                </button>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                                    Downloads a SQL dump of the database.
                                    <br />
                                    <span style={{ color: 'var(--accent-color)', opacity: 0.8 }}>
                                        ℹ️ Automated backups run daily at 03:00 AM (local time).
                                    </span>
                                </p>
                            </div>

                            <div className="form-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ marginBottom: 0 }}>Enable Debug Mode</label>
                                    <input
                                        type="checkbox"
                                        checked={debugMode}
                                        onChange={handleDebugChange}
                                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                    />
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                                    Show detailed logs for actions like Sync.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div>


                            <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                                <h4>Privacy Settings</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>
                                    Control what you share with other users on this server.
                                </p>

                                <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ marginBottom: 0, fontWeight: 600 }}>Share my library</label>
                                    <input
                                        type="checkbox"
                                        checked={privacySettings.share_library}
                                        onChange={(e) => updatePrivacySettings({ ...privacySettings, share_library: e.target.checked })}
                                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                    />
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '-10px', marginBottom: '15px' }}>
                                    If disabled, your library is completely hidden from other users.
                                </p>

                                {privacySettings.share_library && (
                                    <div className="form-group" style={{ marginBottom: '20px', padding: '10px', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                        <label style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Library Name (Public)</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input
                                                type="text"
                                                value={privacySettings.library_name || ''}
                                                placeholder={`${user?.username}'s Library`}
                                                onChange={(e) => setPrivacySettings({ ...privacySettings, library_name: e.target.value })}
                                                onBlur={(e) => updatePrivacySettings({ ...privacySettings, library_name: e.target.value })}
                                                style={{ flex: 1 }}
                                            />
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            Controls the name shown in the sidebar for users you share with.
                                        </p>
                                    </div>
                                )}

                                <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: privacySettings.share_library ? 1 : 0.5 }}>
                                    <label style={{ marginBottom: 0 }}>Share my shelves with other users</label>
                                    <input
                                        type="checkbox"
                                        checked={privacySettings.share_shelves}
                                        disabled={!privacySettings.share_library}
                                        onChange={(e) => updatePrivacySettings({ ...privacySettings, share_shelves: e.target.checked })}
                                        style={{ width: '20px', height: '20px', cursor: privacySettings.share_library ? 'pointer' : 'not-allowed' }}
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: privacySettings.share_library ? 1 : 0.5 }}>
                                    <label style={{ marginBottom: 0 }}>Share my reading progress and status</label>
                                    <input
                                        type="checkbox"
                                        checked={privacySettings.share_progress}
                                        disabled={!privacySettings.share_library}
                                        onChange={(e) => updatePrivacySettings({ ...privacySettings, share_progress: e.target.checked })}
                                        style={{ width: '20px', height: '20px', cursor: privacySettings.share_library ? 'pointer' : 'not-allowed' }}
                                    />
                                </div>
                            </div>

                            <h4>Change Password</h4>
                            <form onSubmit={handleChangePassword}>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="primary-btn">Update Password</button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'filters' && (
                        <div>

                            <div className="form-group">
                                <label>Default Sort Order</label>
                                <select value={defaultSort} onChange={handleSortChange}>
                                    <option value="added_desc">Date Added (Newest First)</option>
                                    <option value="added_asc">Date Added (Oldest First)</option>
                                    <option value="title_asc">Title (A-Z)</option>
                                    <option value="author_asc">Author (A-Z)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {activeTab === 'export' && (
                        <div>

                            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                                Download your library metadata.
                            </p>
                            <div className="form-group">
                                <label>Export Format</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="secondary-btn" onClick={handleExportJSON} style={{ flex: 1 }}>
                                        Export JSON
                                    </button>
                                    <button className="secondary-btn" onClick={handleExportCSV} style={{ flex: 1 }}>
                                        Export CSV
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === ('debug' as any) && user?.is_admin && (
                        <div>

                            <div className="alert alert-warning">
                                <strong>Warning:</strong> These actions are destructive and intended for development only.
                            </div>

                            <div className="form-group">
                                <label>Dataset Generation</label>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                                    Wipe the entire database and generate a fresh large dataset with 5 test users and ~30 rich book records.
                                </p>
                                <button
                                    className="primary-btn"
                                    onClick={async () => {
                                        openConfirm('Generate Dummy Data', 'This will WIPE ALL DATA and replace it with test data. Are you sure?', async () => {
                                            try {
                                                const token = localStorage.getItem('bookboss_token');
                                                const res = await fetch('/api/admin/debug/generate-data', {
                                                    method: 'POST',
                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                    alert(data.message);
                                                    window.location.reload();
                                                } else {
                                                    alert('Error: ' + data.error);
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                alert('Failed to trigger generation');
                                            }
                                        }, true);
                                    }}
                                    style={{ background: 'var(--danger-color)', width: '100%' }}
                                >
                                    ⚠️ Reset & Generate Dummy Data
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && user?.is_admin && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div></div>
                                {!showAddUser && (
                                    <button className="secondary-btn small" onClick={() => {
                                        setEditingUser(null);
                                        setNewUsername('');
                                        setNewUserPassword('');
                                        setNewUserIsAdmin(false);
                                        setShowAddUser(true);
                                    }}>
                                        + Add User
                                    </button>
                                )}
                            </div>

                            {showAddUser && (
                                <div style={{ marginBottom: '20px', padding: '20px', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                    <h4 style={{ marginTop: 0, marginBottom: '15px' }}>{editingUser ? 'Edit User' : 'New User'}</h4>
                                    <div className="form-group">
                                        <label>Username</label>
                                        <input
                                            type="text"
                                            placeholder="Username"
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            style={{ padding: '8px', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            placeholder={editingUser ? "New Password (leave blank to keep current)" : "Password"}
                                            value={newUserPassword}
                                            onChange={(e) => setNewUserPassword(e.target.value)}
                                            style={{ padding: '8px', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Permissions</label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'normal', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={newUserIsAdmin}
                                                onChange={(e) => setNewUserIsAdmin(e.target.checked)}
                                                style={{ width: '16px', height: '16px' }}
                                            />
                                            Administrator (Full Access)
                                        </label>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                        <button className="primary-btn small" onClick={editingUser ? updateUser : handleCreateUser}>
                                            {editingUser ? 'Update User' : 'Create User'}
                                        </button>
                                        <button className="secondary-btn small" onClick={cancelEdit}>Cancel</button>
                                    </div>
                                </div>
                            )}

                            <div>
                                {usersError && (
                                    <div style={{
                                        padding: '10px',
                                        marginBottom: '15px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid var(--danger-color)',
                                        borderRadius: '8px',
                                        color: 'var(--danger-color)',
                                        fontSize: '0.9rem'
                                    }}>
                                        {usersError}
                                    </div>
                                )}
                                {!usersError && users.length === 0 && <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No users found.</p>}
                                <table className="data-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Username</th>
                                            <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Role</th>
                                            <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Library Stats</th>
                                            <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u: any) => (
                                            <tr key={u.id} style={{ background: 'var(--glass-bg)', borderRadius: '6px', transition: 'transform 0.2s' }}>
                                                <td style={{ padding: '10px 12px', fontSize: '0.9rem', fontWeight: 500, borderRadius: '6px 0 0 6px' }}>{u.username}</td>
                                                <td style={{ padding: '10px 12px', fontSize: '0.9rem' }}>{u.is_admin ? <span className="badge small">Admin</span> : <span style={{ opacity: 0.7 }}>User</span>}</td>
                                                <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.9rem' }}>
                                                    {u.book_count !== undefined ?
                                                        <span style={{ fontWeight: 500 }}>{u.book_count} Books</span> :
                                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Run Sync</span>
                                                    }
                                                </td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right', borderRadius: '0 6px 6px 0' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                        <button
                                                            className="icon-btn small"
                                                            onClick={() => startEditingUser(u)}
                                                            title="Edit User"
                                                            style={{ padding: '6px', background: 'var(--glass-border)', borderRadius: '4px', fontSize: '0.8rem' }}
                                                        >
                                                            ✏️
                                                        </button>
                                                        {!u.is_admin && (
                                                            <>
                                                                <button
                                                                    className="icon-btn small"
                                                                    onClick={async () => {
                                                                        openConfirm('Wipe Library', `Delete all books and shelves for ${u.username}?`, async () => {
                                                                            try {
                                                                                const token = localStorage.getItem('bookboss_token');
                                                                                await fetch(`/api/admin/libraries/${u.id}/wipe`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                                                                showToast('Library wiped', 'success');
                                                                                fetchUsers(); // Refresh
                                                                            } catch (e) { console.error(e); showToast('Failed', 'error'); }
                                                                        }, true);
                                                                    }}
                                                                    title="Wipe Library"
                                                                    style={{ color: 'var(--danger-color)', padding: '6px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px', fontSize: '0.8rem' }}
                                                                >
                                                                    🗑️
                                                                </button>
                                                                <button
                                                                    className="icon-btn small"
                                                                    onClick={() => { setUserToDelete(u); openConfirm('Delete User', `Delete ${u.username}?`, deleteUser, true); }}
                                                                    title="Delete User"
                                                                    style={{ color: 'var(--danger-color)', padding: '6px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px', fontSize: '0.8rem' }}
                                                                >
                                                                    ❌
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}


                    {
                        activeTab === 'audiobookshelf' && user?.is_admin && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <div></div>
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
                                            <input
                                                type="password"
                                                placeholder={isEditingServer ? "Enter new API Key to update" : "Paste API Key here"}
                                                value={newServerApiKey}
                                                onChange={(e) => setNewServerApiKey(e.target.value)}
                                            />
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
                                        absServers.map(server => (
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
                        )
                    }

                    {
                        activeTab === 'backup' && user?.is_admin && (
                            <div className="settings-section">


                                <div className="setting-group">
                                    <h4>Export Library</h4>
                                    <p className="setting-description">Download your library data in different formats.</p>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <button onClick={handleExportCSV} className="secondary-btn">
                                            📄 Export as CSV
                                        </button>
                                        <button onClick={handleExportJSON} className="secondary-btn">
                                            {'{ }'} Export as JSON
                                        </button>
                                    </div>
                                </div>

                                {user?.is_admin && (
                                    <div className="setting-group" style={{ marginTop: '30px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                                        <h4>Database Backup</h4>
                                        <p className="setting-description">Create a full backup of your database or restore from a previous backup.</p>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                                            <div>
                                                <button onClick={handleBackup} className="primary-btn">
                                                    ⬇️ Create Full Backup
                                                </button>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                                                    Downloads a .sql file containing all your data.
                                                </p>
                                            </div>

                                            <div style={{ marginTop: '15px' }}>
                                                <label className="secondary-btn" style={{ display: 'inline-block', cursor: 'pointer', background: isRestoring ? '#ccc' : undefined }}>
                                                    {isRestoring ? '⏳ Restoring...' : '⬆️ Restore from Backup'}
                                                    <input
                                                        type="file"
                                                        accept=".sql"
                                                        onChange={handleRestore}
                                                        disabled={isRestoring}
                                                        style={{ display: 'none' }}
                                                    />
                                                </label>
                                                <p style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '5px', fontWeight: 'bold' }}>
                                                    ⚠️ Warning: Restoring will overwrite all current data!
                                                </p>
                                            </div>
                                        </div>

                                        {backupStatus && (
                                            <div style={{
                                                marginTop: '15px',
                                                padding: '10px',
                                                borderRadius: '6px',
                                                background: backupStatus.includes('failed') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                color: backupStatus.includes('failed') ? '#ef4444' : '#10b981',
                                                border: `1px solid ${backupStatus.includes('failed') ? '#ef4444' : '#10b981'}`
                                            }}>
                                                {backupStatus}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    }
                </main >
            </div >

            {/* Delete Confirmation Modal */}
            {
                userToDelete && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000
                    }}>
                        <div style={{
                            background: 'var(--glass-bg)',
                            padding: '30px',
                            borderRadius: '12px',
                            border: '1px solid var(--glass-border)',
                            maxWidth: '400px',
                            width: '90%'
                        }}>
                            <h3 style={{ marginTop: 0 }}>Delete User</h3>
                            <p>Are you sure you want to delete user <strong>{userToDelete.username}</strong>?</p>
                            <p style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>This action cannot be undone.</p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button
                                    className="secondary-btn"
                                    onClick={() => setUserToDelete(null)}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="primary-btn"
                                    onClick={deleteUser}
                                    style={{ flex: 1, background: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <LogViewerModal
                isOpen={showLogs}
                onClose={() => setShowLogs(false)}
                logs={logs}
            />

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast({ ...toast, isVisible: false })}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isDanger={confirmModal.isDanger}
            />

            <MetadataRefreshModal
                isOpen={isMetadataRefreshOpen}
                onClose={() => setIsMetadataRefreshOpen(false)}
            />
        </Modal >
    );
};
