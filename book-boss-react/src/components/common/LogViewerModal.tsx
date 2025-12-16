import React from 'react';

interface LogViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: string[];
    title?: string;
}

const LogViewerModal: React.FC<LogViewerModalProps> = ({ isOpen, onClose, logs, title = 'Sync Logs' }) => {
    if (!isOpen) return null;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(logs.join('\n'));
        alert('Logs copied to clipboard!');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="close-modal-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <div style={{
                        background: '#1e1e1e',
                        color: '#d4d4d4',
                        padding: '1rem',
                        borderRadius: '4px',
                        height: '400px',
                        overflowY: 'auto',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.9rem',
                        marginBottom: '1rem'
                    }}>
                        {logs.length === 0 ? (
                            <div style={{ color: '#888' }}>No logs available.</div>
                        ) : (
                            logs.map((log, index) => (
                                <div key={index} style={{ borderBottom: '1px solid #333', padding: '2px 0' }}>
                                    {log}
                                </div>
                            ))
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button className="btn btn-secondary" onClick={copyToClipboard}>Copy to Clipboard</button>
                        <button className="btn btn-primary" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogViewerModal;
