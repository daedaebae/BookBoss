import React, { useState } from 'react';
import { ReactReader } from 'react-reader';
import { Modal } from '../common/Modal';

interface EpubReaderModalProps {
    isOpen: boolean;
    onClose: () => void;
    epubUrl: string;
    bookTitle: string;
    bookId?: number;
}

export const EpubReaderModal: React.FC<EpubReaderModalProps> = ({
    isOpen,
    onClose,
    epubUrl,
    bookTitle,
    bookId
}) => {
    const [location, setLocation] = useState<string | number>(0);

    // Load saved location from localStorage
    React.useEffect(() => {
        if (bookId) {
            const savedLocation = localStorage.getItem(`epub_location_${bookId}`);
            if (savedLocation) {
                setLocation(savedLocation);
            }
        }
    }, [bookId]);

    const locationChanged = (epubcfi: string) => {
        setLocation(epubcfi);
        // Save reading progress
        if (bookId) {
            localStorage.setItem(`epub_location_${bookId}`, epubcfi);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={bookTitle}
            maxWidth="1200px"
        >
            <div style={{ height: '70vh', position: 'relative' }}>
                <ReactReader
                    url={epubUrl}
                    location={location}
                    locationChanged={locationChanged}
                    epubOptions={{
                        flow: 'paginated',
                        manager: 'continuous',
                    }}
                />
            </div>
            <div style={{
                marginTop: '15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0'
            }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Use arrow keys or swipe to navigate
                </div>
                <button className="secondary-btn" onClick={onClose}>
                    Close Reader
                </button>
            </div>
        </Modal>
    );
};
