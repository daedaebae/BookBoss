import React, { useState, useEffect } from 'react';
import { SettingsModal } from '../components/settings/SettingsModal';
import { Sidebar, type SidebarFilter } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
// import { useTheme } from '../context/ThemeContext';
import { FeatureCard } from '../components/features/FeatureCard';
import { FeatureFormModal } from '../components/features/FeatureFormModal';
import { featureService, type FeatureRequest } from '../services/featureService';
import { Toast } from '../components/common/Toast';

export const Features: React.FC = () => {
    const { user, logout } = useAuth();
    // const { theme, setTheme } = useTheme();
    const [features, setFeatures] = useState<FeatureRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'my' | 'planned' | 'completed' | 'archived'>('all');
    const [filterText, setFilterText] = useState('');
    const [sortOrder, setSortOrder] = useState<'votes' | 'newest' | 'oldest'>('votes');
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // Added state
    const [toast, setToast] = useState({ message: '', type: 'info' as 'success' | 'error' | 'info', isVisible: false });

    // Sidebar state stub to keep Sidebar component happy
    const [sidebarFilter] = useState<SidebarFilter>({ type: 'all' });

    useEffect(() => {
        loadFeatures();
    }, []);

    const loadFeatures = async () => {
        try {
            setIsLoading(true);
            const data = await featureService.getFeatures();
            setFeatures(data);
        } catch (err) {
            console.error('Error loading features:', err);
            showToast('Failed to load feature requests', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (title: string, description: string, reqType: 'bug' | 'feature') => {
        try {
            const response = await featureService.createFeature(title, description, reqType);
            if (response.warning) {
                showToast(response.warning, 'info');
            } else {
                showToast('Feature request submitted!', 'success');
            }
            loadFeatures();
        } catch (err) {
            console.error('Error creating feature:', err);
            showToast('Failed to submit request', 'error');
        }
    };

    const handleVote = async (id: number) => {
        try {
            const result = await featureService.toggleVote(id);
            setFeatures(prev => prev.map(f => {
                if (f.id === id) {
                    return { ...f, vote_count: result.new_count, voted_by_me: result.voted };
                }
                return f;
            }));
        } catch (err) {
            console.error('Error voting:', err);
            showToast('Failed to register vote', 'error');
        }
    };

    const handleStatusChange = async (id: number, status: string, admin_note?: string) => {
        try {
            await featureService.updateFeature(id, { status, admin_note });
            showToast('Feature updated', 'success');
            loadFeatures();
        } catch (err) {
            console.error('Error updating feature:', err);
            showToast('Failed to update feature', 'error');
        }
    };

    const handleSyncGithub = async () => {
        try {
            setIsLoading(true);
            const data = await featureService.syncGithubFeatures();
            showToast(data.message, 'success');
            await loadFeatures();
        } catch (err: any) {
            console.error('Error syncing features:', err);
            showToast(err.response?.data?.error || 'Failed to sync with GitHub', 'error');
            setIsLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type, isVisible: true });
    };

    // Filter + Sort Logic
    const filteredFeatures = features
        .filter(f => {
            const matchesText = f.title.toLowerCase().includes(filterText.toLowerCase()) ||
                f.description.toLowerCase().includes(filterText.toLowerCase());
            if (!matchesText) return false;
            if (activeTab === 'my') return f.created_by === user?.username;
            if (activeTab === 'planned') return f.status === 'planned' || f.status === 'in_progress';
            if (activeTab === 'completed') return f.status === 'completed';
            if (activeTab === 'archived') return f.status === 'archived';
            // Default 'all' tab excludes archived (admins can see them in the Archived tab)
            return f.status !== 'archived';
        })
        .sort((a, b) => {
            if (sortOrder === 'votes') return b.vote_count - a.vote_count;
            if (sortOrder === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortOrder === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            return 0;
        });

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
            <Sidebar
                activeFilter={sidebarFilter}
                onFilterChange={(filter) => {
                    const params = new URLSearchParams();
                    params.set('type', filter.type);
                    if (filter.value) params.set('value', filter.value);
                    if (filter.shelfId) params.set('shelfId', filter.shelfId.toString());
                    if (filter.userId) params.set('userId', filter.userId.toString());
                    window.location.href = `/?${params.toString()}`;
                }}
                shelves={[]} // Stub
                seriesList={[]} // Stub
                onShelvesChanged={() => { }} // Stub
                onLibrariesChanged={() => { }} // Stub
                bookCounts={{
                    total: 0,
                    notStarted: 0,
                    inProgress: 0,
                    completed: 0,
                    dnf: 0,
                    physical: 0,
                    ebook: 0,
                    audiobook: 0,
                    loaned: 0,
                    overdue: 0
                }} // Stub
                isMobileOpen={isMobileSidebarOpen}
                onMobileClose={() => setIsMobileSidebarOpen(false)}
                onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
                isVisible={isSidebarVisible}
                user={user}
                onLogout={logout}
                onSettingsClick={() => setIsSettingsModalOpen(true)} // Connected
            />

            <div className="content-area" style={{
                marginLeft: isSidebarVisible ? 'var(--sidebar-width)' : '0',
                flex: 1,
                transition: 'margin-left 0.3s ease'
            }}>
                <Header
                    title="Requests"
                    onMobileSidebarToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    onDesktopSidebarToggle={() => setIsSidebarVisible(!isSidebarVisible)}
                    isSidebarVisible={isSidebarVisible}
                >
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as any)}
                            className="secondary-btn small"
                            style={{ appearance: 'none', paddingRight: '28px', backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b5cf6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', backgroundSize: '14px' }}
                        >
                            <option value="votes">Most Votes</option>
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                        </select>
                        {user?.is_admin && (
                            <button
                                className="secondary-btn"
                                onClick={handleSyncGithub}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                ⎇ Sync GitHub
                            </button>
                        )}
                        <button
                            className="primary-btn"
                            onClick={() => setIsFormOpen(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <span>+</span> New Request
                        </button>
                    </div>
                </Header>

                <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: 'var(--glass-border)', flexWrap: 'wrap' }}>
                        {[
                            { id: 'all', label: 'All Requests', adminOnly: false },
                            { id: 'planned', label: 'Planned', adminOnly: false },
                            { id: 'completed', label: 'Completed', adminOnly: false },
                            { id: 'my', label: 'My Requests', adminOnly: false },
                            { id: 'archived', label: 'Archived', adminOnly: true }
                        ].filter(tab => !tab.adminOnly || user?.is_admin).map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    padding: '12px 0',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: activeTab === tab.id ? '2px solid var(--accent-color)' : '2px solid transparent',
                                    color: activeTab === tab.id ? 'var(--accent-color)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '1rem'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div style={{ marginBottom: '30px' }}>
                        <input
                            type="text"
                            placeholder="Search requests..."
                            value={filterText}
                            onChange={e => setFilterText(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 20px',
                                borderRadius: '30px',
                                border: 'var(--glass-border)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Grid */}
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {filteredFeatures.map(feature => (
                                <FeatureCard
                                    key={feature.id}
                                    feature={feature}
                                    onVote={handleVote}
                                    isAdmin={!!user?.is_admin}
                                    onStatusChange={handleStatusChange}
                                />
                            ))}
                            {filteredFeatures.length === 0 && (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                    No requests found.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <FeatureFormModal
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleCreate}
                />

                <SettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    onSettingsChange={() => { }} // No library reload needed for features page
                />

                <Toast
                    message={toast.message}
                    type={toast.type}
                    isVisible={toast.isVisible}
                    onClose={() => setToast({ ...toast, isVisible: false })}
                />
            </div>
        </div>
    );
};
