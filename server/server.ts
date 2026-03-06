/*
 * MIT License
 * Copyright (c) 2026
 * See LICENSE file for details
 */

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
import './src/config/env'; // Validate environment variables after loading them
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from './src/utils/logger';
import db from './src/config/db'; // Ensure DB connection is initialized
import apiRoutes from './src/routes';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 5000;

// Middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development/images
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
// Ensure uploads directory exists
const fs = require('fs');
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const coversDir = path.join(uploadDir, 'covers');
if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

import opdsRoutes from './src/routes/opdsRoutes';
import emailRoutes from './src/routes/emailRoutes';

// API Routes
app.use('/api/opds', opdsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api', apiRoutes);

// 404 handler for unknown /api routes — must come AFTER apiRoutes and BEFORE the SPA fallback
app.use('/api', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

// ABS Proxy (if passing through audio?) - Not implemented in this refactor, relying on direct ABS client or frontend.

// Serve React Frontend (Production)
const publicPath = path.join(process.cwd(), 'public');
if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    logger.info(`Serving static files from ${publicPath}`);

    app.get(/(.*)/, (req, res) => {
        res.sendFile(path.join(publicPath, 'index.html'));
    });
} else {
    logger.warn('Frontend build not found in public/ directory. API only mode.');
}

// Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, '0.0.0.0', () => {
    logger.info(`Server running on port ${port}`);
});
