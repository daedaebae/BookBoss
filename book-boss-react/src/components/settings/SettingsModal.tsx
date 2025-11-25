import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SettingsTab = 'general' | 'profile' | 'filters' | 'export' | 'users' | 'audiobookshelf';

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

    // Filter settings
    const [defaultSort, setDefaultSort] = useState('added_desc');

    // Export settings
    const [exportFormat, setExportFormat] = useState('json');

    // Users (admin only)
    const [users, setUsers] = useState<any[]>([]);
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
        }
    }, [isOpen]);

    const fetchSettings = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/settings', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('bookboss_token')}`
                }
            });
            if (response.ok) {
                const settings = await response.json();
                setAccentColor(settings.accent_color || 'theme-purple');
                setAllowRegistration(settings.allow_registration === 'true');
                // Sync global theme
                if (settings.accent_color) {
                    setGlobalAccentColor(settings.accent_color);
                }
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

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('bookboss_token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const createUser = async () => {
        if (!newUsername || !newUserPassword) {
            alert('Username and password required');
            return;
        }
        try {
            const response = await fetch('http://localhost:3000/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('bookboss_token')}`
                },
                body: JSON.stringify({
                    username: newUsername,
                    password: newUserPassword,
                    isAdmin: newUserIsAdmin
                })
            });
            if (response.ok) {
                alert('User created successfully!');
                setShowAddUser(false);
                setNewUsername('');
                setNewUserPassword('');
                setNewUserIsAdmin(false);
                fetchUsers();
            }
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
                isAdmin: newUserIsAdmin
            };
            if (newUserPassword) {
                body.password = newUserPassword;
            }

            const response = await fetch(`http://localhost:3000/api/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('bookboss_token')}`
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                alert('User updated successfully!');
                setEditingUser(null);
                setShowAddUser(false);
                setNewUsername('');
                setNewUserPassword('');
                setNewUserIsAdmin(false);
                fetchUsers();
            }
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
            const response = await fetch(`http://localhost:3000/api/users/${userToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('bookboss_token')}`
                }
            });
            if (response.ok) {
                alert('User deleted successfully');
                setUserToDelete(null);
                fetchUsers();
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('Failed to delete user');
            setUserToDelete(null);
        }
    };

    const fetchAbsServers = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/audiobookshelf/servers', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('bookboss_token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setAbsServers(data);
            }
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
            const response = await fetch(`http://localhost:3000/api/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('bookboss_token')}`
                },
                body: JSON.stringify({ password: newPassword })
            });
            if (response.ok) {
                alert('Password updated successfully');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error) {
            console.error('Failed to update password:', error);
            alert('Failed to update password');
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
            const response = await fetch('http://localhost:3000/api/books/refresh-metadata', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('bookboss_token')}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `Server returned ${response.status}`);
            }

            const result = await response.json();
            setRefreshProgress(100);
            setRefreshStatus(result.message || 'Completed!');
            alert(`Metadata refresh completed! Processed ${result.processed} books.`);
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

    const exportLibrary = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/books', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('bookboss_token')}`
                }
            });
            if (response.ok) {
                const books = await response.json();
                let content = '';
                let mimeType = '';
                let filename = `library_export_${new Date().toISOString().split('T')[0]}`;

                if (exportFormat === 'json') {
                    content = JSON.stringify(books, null, 2);
                    mimeType = 'application/json';
                    filename += '.json';
                } else if (exportFormat === 'csv') {
                    const headers = ['Title', 'Author', 'ISBN', 'Library', 'Added At'];
                    const rows = books.map((b: any) => [
                        `"${b.title.replace(/"/g, '""')}"`,
                        `"${b.author.replace(/"/g, '""')}"`,
                        `"${b.isbn || ''}"`,
                        `"${b.library || ''}"`,
                        `"${b.added_at}"`
                    ]);
                    content = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
                    mimeType = 'text/csv';
                    filename += '.csv';
                }

                const blob = new Blob([content], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                alert(`Library exported as ${exportFormat.toUpperCase()}`);
            }
        } catch (error) {
            console.error('Failed to export library:', error);
            alert('Failed to export library');
        }
    };

    const downloadBackup = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/admin/backup', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('bookboss_token')}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                // Use filename from header if available, else generate one
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = `bookboss_backup_${new Date().toISOString().split('T')[0]}.json`;
                if (contentDisposition) {
                    const match = contentDisposition.match(/filename="?([^"]+)"?/);
                    if (match) filename = match[1];
                }

                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Failed to download backup');
            }
        } catch (error) {
            console.error('Backup error:', error);
            alert('Backup failed');
        }
    };

    const tabs = [
        { id: 'general' as SettingsTab, label: 'General', adminOnly: true },
        { id: 'profile' as SettingsTab, label: 'Profile', adminOnly: false },
        { id: 'filters' as SettingsTab, label: 'Filters', adminOnly: false },
        { id: 'export' as SettingsTab, label: 'Export', adminOnly: false },
        { id: 'users' as SettingsTab, label: 'Users', adminOnly: true },
        { id: 'audiobookshelf' as SettingsTab, label: 'Audiobookshelf', adminOnly: true },
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
                                    onClick={downloadBackup}
                                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                                >
                                    ⬇️ Download Database Backup
                                </button>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                                    Downloads a JSON file containing all books, users, and settings.
                                </p>
                            </div>
                            <button className="primary-btn" onClick={saveSettings}>Save Changes</button>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div>
                            <h3>My Profile</h3>
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
                                <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                                    <option value="json">JSON</option>
                                    <option value="csv">CSV</option>
                                </select>
                            </div>
                            <button className="primary-btn" onClick={exportLibrary}>Export Library</button>
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
                                        <button className="primary-btn small" onClick={editingUser ? updateUser : createUser}>
                                            {editingUser ? 'Update User' : 'Create User'}
                                        </button>
                                        <button className="secondary-btn small" onClick={cancelEdit}>Cancel</button>
                                    </div>
                                </div>
                            )}

                            <div>
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
