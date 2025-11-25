import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { type Shelf } from '../../types/shelf';
import { shelfService } from '../../services/shelfService';

interface ShelfManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onShelvesUpdated: () => void;
}

export const ShelfManagerModal: React.FC<ShelfManagerModalProps> = ({ isOpen, onClose, onShelvesUpdated }) => {
    const [shelves, setShelves] = useState<Shelf[]>([]);
    const [newShelfName, setNewShelfName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadShelves();
        }
    }, [isOpen]);

    const loadShelves = async () => {
        try {
            const data = await shelfService.getShelves();
            setShelves(data);
        } catch (error) {
            console.error('Error loading shelves:', error);
        }
    };

    const handleCreateShelf = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newShelfName.trim()) return;

        setLoading(true);
        try {
            await shelfService.createShelf(newShelfName);
            setNewShelfName('');
            await loadShelves();
            onShelvesUpdated();
        } catch (error) {
            console.error('Error creating shelf:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteShelf = async (id: number) => {
        if (!confirm('Are you sure you want to delete this shelf? Books will not be deleted.')) return;

        try {
            await shelfService.deleteShelf(id);
            await loadShelves();
            onShelvesUpdated();
        } catch (error) {
            console.error('Error deleting shelf:', error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Shelves">
            <div className="shelf-manager">
                <form onSubmit={handleCreateShelf} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        placeholder="New Shelf Name"
                        value={newShelfName}
                        onChange={(e) => setNewShelfName(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button type="submit" className="primary-btn" disabled={loading}>
                        Add
                    </button>
                </form>

                <div className="shelf-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {shelves.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No custom shelves yet.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {shelves.map((shelf) => (
                                <li key={shelf.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px',
                                    borderBottom: '1px solid var(--glass-border)'
                                }}>
                                    <span>{shelf.name}</span>
                                    <button
                                        onClick={() => handleDeleteShelf(shelf.id)}
                                        className="icon-btn"
                                        title="Delete Shelf"
                                        style={{ color: 'var(--danger-color)' }}
                                    >
                                        🗑️
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </Modal>
    );
};
