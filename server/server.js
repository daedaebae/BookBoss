/*
 * MIT License
 * Copyright (c) 2026
 * See LICENSE file for details
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('./src/config/env'); // Validate environment variables after loading them
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./src/utils/logger');
const db = require('./src/config/db'); // Ensure DB connection is initialized
const apiRoutes = require('./src/routes');

const app = express();
const port = process.env.PORT || 5000;

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
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const coversDir = path.join(uploadDir, 'covers');
if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const opdsRoutes = require('./src/routes/opdsRoutes');
const emailRoutes = require('./src/routes/emailRoutes');

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
const publicPath = path.join(__dirname, 'public');
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
app.use((err, req, res, next) => {
    logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, '0.0.0.0', () => {
    logger.info(`Server running on port ${port}`);
});
