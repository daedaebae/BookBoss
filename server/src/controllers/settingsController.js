const db = require('../config/db');

const getSettings = (req, res) => {
    db.query('SELECT * FROM settings', (err, results) => {
        if (err) {
            console.error('Error fetching settings:', err);
            res.status(500).json({ error: 'Failed to fetch settings' });
            return;
        }
        const settings = results.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(settings);
    });
};

const updateSettings = (req, res) => {
    const settings = req.body;

    if (!settings || Object.keys(settings).length === 0) {
        return res.status(400).json({ error: 'No settings provided' });
    }

    const keys = Object.keys(settings);
    let completed = 0;
    let hasError = false;

    keys.forEach(key => {
        const value = settings[key];
        const query = 'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?';
        db.query(query, [key, value, value], (err) => {
            if (err) {
                console.error(`Error saving setting ${key}:`, err);
                hasError = true;
            }
            completed++;
            if (completed === keys.length) {
                if (hasError) {
                    res.status(500).json({ error: 'Some settings failed to save' });
                } else {
                    res.json({ message: 'Settings saved successfully' });
                }
            }
        });
    });
};

module.exports = {
    getSettings,
    updateSettings
};
