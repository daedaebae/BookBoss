import db from '../config/db';

const getSettings = (req, res) => {
    db.query('SELECT * FROM settings', (err, results) => {
        if (err) {
            console.error('Error fetching settings:', err);
            res.status(500).json({ error: 'Failed to fetch settings' });
            return;
        }
        const settings = (results as any[]).reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        // Expose presence of env vars so UI can offer to "remove" (ignore) them
        settings._env = {
            has_github: !!process.env.GITHUB_TOKEN || !!process.env.GITHUB_REPO,
            has_ntfy: !!process.env.NTFY_TOPIC || !!process.env.NTFY_SERVER_URL
        };

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

export default {
    getSettings,
    updateSettings
};
