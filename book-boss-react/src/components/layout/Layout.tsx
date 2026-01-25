import React from 'react';
import { JobIndicator } from '../common/JobIndicator';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="app-container">
            <div style={{ position: 'fixed', top: '15px', right: '80px', zIndex: 1000 }}>
                <JobIndicator />
            </div>
            {children}
        </div>
    );
};
