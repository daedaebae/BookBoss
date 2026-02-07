require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const db = require('./src/config/db'); // Ensure DB connection is initialized
const apiRoutes = require('./src/routes');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
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

// API Routes
app.use('/api', apiRoutes);

// ABS Proxy (if passing through audio?) - Not implemented in this refactor, relying on direct ABS client or frontend.

// Serve React Frontend (Production)
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    console.log(`Serving static files from ${publicPath}`);

    app.get('*', (req, res) => {
        res.sendFile(path.join(publicPath, 'index.html'));
    });
} else {
    console.warn('Frontend build not found in public/ directory. API only mode.');
}

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
