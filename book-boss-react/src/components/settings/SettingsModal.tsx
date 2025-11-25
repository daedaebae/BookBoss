import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { exportService } from '../../services/exportService';
import { userService } from '../../services/userService';
import { settingsService } from '../../services/settingsService';
import { bookService } from '../../services/bookService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SettingsTab = 'general' | 'profile' | 'filters' | 'export' | 'users' | 'audiobookshelf' | 'backup';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { setAccentColor: setGlobalAccentColor } = useTheme();
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    // General settings
    const [accentColor, setAccentColor] = useState('theme-purple');
    const [allowRegistration, setAllowRegistration] = useState(false);

    // Profile settings
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [privacySettings, setPrivacySettings] = useState({
        share_shelves: false,
        share_progress: false
    });

    // Filter settings
    const [defaultSort, setDefaultSort] = useState('added_desc');



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
    const [newServerUsername, setNewServerUsername] = useState('');
    const [newServerPassword, setNewServerPassword] = useState('');

    // Metadata refresh
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshProgress, setRefreshProgress] = useState(0);
    const [refreshStatus, setRefreshStatus] = useState('');

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
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        }
    };

    const saveSettings = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('bookboss_token')}`
                },
                body: JSON.stringify({
                    accent_color: accentColor,
                    allow_registration: allowRegistration.toString()
                })
            });
            if (response.ok) {
                setGlobalAccentColor(accentColor);
                alert('Settings saved successfully!');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings');
        }
    };

    /**
     * Fetches the list of users from the API
     * Requires admin authentication
     */
    const fetchUsers = async () => {
        try {
            const data = await userService.getUsers();
            setUsers(data);
            setUsersError(null);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setUsersError('Failed to load users.');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername || !newUserPassword) {
            alert('Username and password required');
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

            alert('User updated successfully!');
            setEditingUser(null);
            setShowAddUser(false);
            setNewUsername('');
            setNewUserPassword('');
            setNewUserIsAdmin(false);
            fetchUsers();
        } catch (error) {
            console.error('Failed to update user:', error);
            alert('Failed to update user');
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
            alert('User deleted successfully');
            setUserToDelete(null);
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('Failed to delete user');
        } finally {
            setUserToDelete(null);
        }
    };

    const fetchAbsServers = async () => {
        try {
            const data = await settingsService.getAbsServers();
            setAbsServers(data);
        } catch (error) {
            console.error('Failed to fetch ABS servers:', error);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        if (!user) return;

        try {
            await userService.updateProfile({ password: newPassword });
            alert('Password updated successfully');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Failed to update password:', error);
            alert('Failed to update password');
        }
    };

    const savePrivacySettings = async () => {
        try {
            await userService.updateProfile({ privacy_settings: privacySettings });
            alert('Privacy settings saved!');
        } catch (error) {
            console.error('Failed to save privacy settings:', error);
            alert('Failed to save privacy settings');
        }
    };

    const saveFilterPreferences = () => {
        localStorage.setItem('bookboss_sort', defaultSort);
        alert('Preferences saved');
    };

    const handleMetadataRefresh = async () => {
        if (!confirm('This will refresh metadata and download cover images for all books. This may take a while. Continue?')) {
            return;
        }

        setIsRefreshing(true);
        setRefreshProgress(10);
        setRefreshStatus('Starting metadata refresh...');

        try {
            const result = await bookService.refreshMetadata();
            setRefreshProgress(100);
            setRefreshStatus(result.message || 'Completed!');
            alert(`Metadata refresh completed!`);
        } catch (error: any) {
            console.error('Metadata refresh error:', error);
            setRefreshStatus(`Error: ${error.message}`);
            alert(`Failed to refresh metadata: ${error.message}`);
        } finally {
            setTimeout(() => {
                setIsRefreshing(false);
                setRefreshProgress(0);
                setRefreshStatus('');
            }, 3000);
        }
    };



    const handleExportCSV = async () => {
        try {
            await exportService.exportCSV();
            alert('Library exported as CSV!');
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export library as CSV');
        }
    };

    const handleExportJSON = async () => {
        try {
            await exportService.exportJSON();
            alert('Library exported as JSON!');
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export library as JSON');
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

        if (!confirm('WARNING: Restoring from a backup will OVERWRITE all current data. This action cannot be undone. Are you sure you want to proceed?')) {
            return;
        }

        setIsRestoring(true);
        setBackupStatus('Restoring database... please wait.');

        try {
            await exportService.restoreBackup(file);
            setBackupStatus('Database restored successfully! Please refresh the page.');
            setTimeout(() => window.location.reload(), 2000);
        } catch (error: any) {
            console.error('Restore failed:', error);
            setBackupStatus(`Restore failed: ${error.message}. Please check the file and try again.`);
        } finally {
            setIsRestoring(false);
        }
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
        <Modal isOpen={isOpen} onClose={onClose} title="Settings">
            <div style={{ display: 'flex', gap: '20px', minHeight: '500px' }}>
                {/* Sidebar */}
                <aside style={{
                    width: '200px',
                    borderRight: '1px solid var(--glass-border)',
                    paddingRight: '20px'
                }}>
                    {visibleTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '12px',
                                marginBottom: '8px',
                                background: activeTab === tab.id ? 'var(--glass-bg)' : 'transparent',
                                border: activeTab === tab.id ? '1px solid var(--accent-color)' : '1px solid transparent',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </aside>

                {/* Content */}
                <main style={{ flex: 1 }}>
                    {activeTab === 'general' && user?.is_admin && (
                        <div>
                            <h3>General Settings</h3>
                            <div className="form-group">
                                <label>Accent Color</label>
                                <select value={accentColor} onChange={(e) => setAccentColor(e.target.value)}>
                                    <option value="theme-purple">Purple</option>
                                    <option value="theme-blue">Blue</option>
                                    <option value="theme-green">Green</option>
                                    <option value="theme-orange">Orange</option>
                                    <option value="theme-pink">Pink</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={allowRegistration}
                                        onChange={(e) => setAllowRegistration(e.target.checked)}
                                    />
                                    {' '}Allow Public Registration
                                </label>
                            </div>
                            <div className="form-group">
                                <label>Library Maintenance</label>
                                <button
                                    className="secondary-btn"
                                    onClick={handleMetadataRefresh}
                                    disabled={isRefreshing}
                                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                                >
                                    {isRefreshing ? (
                                        <>
                                            <span className="loader"></span>
                                            {refreshStatus || 'Refreshing...'}
                                        </>
                                    ) : (
                                        'Sync Metadata & Covers'
                                    )}
                                </button>
                                {isRefreshing && (
                                    <div style={{ marginTop: '10px', width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: `${refreshProgress}%`, height: '100%', background: 'var(--accent-color)', transition: 'width 0.3s' }}></div>
                                    </div>
                                )}
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
                                </p>
                            </div>
                            <button className="primary-btn" onClick={saveSettings}>Save Changes</button>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div>
                            <h3>My Profile</h3>

                            <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                                <h4>Privacy Settings</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>
                                    Control what you share with other users on this server.
                                </p>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'normal', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.share_shelves}
                                            onChange={(e) => setPrivacySettings({ ...privacySettings, share_shelves: e.target.checked })}
                                        />
                                        Share my shelves with other users
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'normal', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.share_progress}
                                            onChange={(e) => setPrivacySettings({ ...privacySettings, share_progress: e.target.checked })}
                                        />
                                        Share my reading progress and status
                                    </label>
                                </div>
                                <button className="primary-btn small" onClick={savePrivacySettings}>Save Privacy Settings</button>
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
                            <h3>Library Defaults</h3>
                            <div className="form-group">
                                <label>Default Sort Order</label>
                                <select value={defaultSort} onChange={(e) => setDefaultSort(e.target.value)}>
                                    <option value="added_desc">Date Added (Newest First)</option>
                                    <option value="added_asc">Date Added (Oldest First)</option>
                                    <option value="title_asc">Title (A-Z)</option>
                                    <option value="author_asc">Author (A-Z)</option>
                                </select>
                            </div>
                            <button className="primary-btn" onClick={saveFilterPreferences}>Save Preferences</button>
                        </div>
                    )}

                    {activeTab === 'export' && (
                        <div>
                            <h3>Export Library</h3>
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

                    {activeTab === 'users' && user?.is_admin && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3>User Management</h3>
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
                                <div style={{ marginBottom: '20px', padding: '15px', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                                    <h4>{editingUser ? 'Edit User' : 'New User'}</h4>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            placeholder="Username"
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            placeholder={editingUser ? "New Password (leave blank to keep current)" : "Password"}
                                            value={newUserPassword}
                                            onChange={(e) => setNewUserPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Permissions</label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal' }}>
                                            <input
                                                type="checkbox"
                                                checked={newUserIsAdmin}
                                                onChange={(e) => setNewUserIsAdmin(e.target.checked)}
                                            />
                                            Administrator (Full Access)
                                        </label>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
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
                                        padding: '15px',
                                        marginBottom: '15px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid var(--danger-color)',
                                        borderRadius: '8px',
                                        color: 'var(--danger-color)'
                                    }}>
                                        {usersError}
                                    </div>
                                )}
                                {!usersError && users.length === 0 && <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No users found.</p>}
                                {users.map(userItem => (
                                    <div key={userItem.id} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px',
                                        marginBottom: '8px',
                                        background: 'var(--glass-bg)',
                                        borderRadius: '8px',
                                        border: userItem.id === user?.id ? '1px solid var(--accent-color)' : 'none'
                                    }}>
                                        <div>
                                            <span style={{ fontWeight: 500 }}>{userItem.username}</span>
                                            {userItem.id === user?.id && <span style={{ marginLeft: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>(You)</span>}
                                            {!!userItem.is_admin && <span style={{
                                                marginLeft: '10px',
                                                padding: '2px 8px',
                                                background: 'var(--accent-color)',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem'
                                            }}>Admin</span>}
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                className="secondary-btn small"
                                                onClick={() => startEditingUser(userItem)}
                                                title="Edit User"
                                            >
                                                ✏️ Edit
                                            </button>
                                            {userItem.id !== user?.id && (
                                                <button
                                                    className="secondary-btn small"
                                                    onClick={() => setUserToDelete(userItem)}
                                                    title="Delete User"
                                                    style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'audiobookshelf' && user?.is_admin && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3>Audiobookshelf Servers</h3>
                                <button className="secondary-btn small" onClick={() => setShowAddServer(!showAddServer)}>
                                    + Add Server
                                </button>
                            </div>

                            {showAddServer && (
                                <div style={{ marginBottom: '20px', padding: '15px', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                                    <h4>Connect New Server</h4>
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
                                            placeholder=""
                                            value={newServerUrl}
                                            onChange={(e) => setNewServerUrl(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Username</label>
                                        <input
                                            type="text"
                                            placeholder="Username"
                                            value={newServerUsername}
                                            onChange={(e) => setNewServerUsername(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            value={newServerPassword}
                                            onChange={(e) => setNewServerPassword(e.target.value)}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="primary-btn small">Connect</button>
                                        <button className="secondary-btn small" onClick={() => setShowAddServer(false)}>Cancel</button>
                                    </div>
                                </div>
                            )}

                            <div>
                                {absServers.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                                        No servers connected.
                                    </p>
                                ) : (
                                    absServers.map(server => (
                                        <div key={server.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px',
                                            marginBottom: '8px',
                                            background: 'var(--glass-bg)',
                                            borderRadius: '8px'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{server.server_name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {server.server_url}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.8rem',
                                                    background: server.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                    color: server.is_active ? '#86efac' : '#fca5a5'
                                                }}>
                                                    {server.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                <button className="delete-btn" title="Remove Server">
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'backup' && user?.is_admin && (
                        <div className="settings-section">
                            <h3>Backup & Restore</h3>

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
                    )}
                </main>
            </div>

            {/* Delete Confirmation Modal */}
            {userToDelete && (
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
            )}
        </Modal>
    );
};
