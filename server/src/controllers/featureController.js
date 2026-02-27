const db = require('../config/db');
const axios = require('axios');

const getFeatureRequests = async (req, res) => {
    const userId = req.user.id;

    try {
        const query = `
            SELECT 
                fr.*,
                u.username as created_by,
                (SELECT COUNT(*) FROM feature_votes fv WHERE fv.feature_request_id = fr.id) as vote_count,
                EXISTS(SELECT 1 FROM feature_votes fv WHERE fv.feature_request_id = fr.id AND fv.user_id = ?) as voted_by_me
            FROM feature_requests fr
            JOIN users u ON fr.user_id = u.id
            ORDER BY vote_count DESC, fr.created_at DESC
        `;

        const [results] = await db.promise().query(query, [userId]);

        const features = results.map(f => ({
            ...f,
            voted_by_me: Boolean(f.voted_by_me)
        }));

        res.json(features);
    } catch (error) {
        console.error('Error fetching features:', error);
        res.status(500).json({ error: 'Failed to fetch feature requests' });
    }
};

const createFeatureRequest = async (req, res) => {
    const userId = req.user.id;
    const { title, description, type } = req.body;
    const reqType = type === 'bug' ? 'bug' : 'feature';

    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const [result] = await db.promise().query(
            'INSERT INTO feature_requests (user_id, title, description, type) VALUES (?, ?, ?, ?)',
            [userId, title.trim(), description || '', reqType]
        );

        // Auto-vote for own request
        await db.promise().query(
            'INSERT INTO feature_votes (user_id, feature_request_id) VALUES (?, ?)',
            [userId, result.insertId]
        );

        const [newFeature] = await db.promise().query(
            `SELECT fr.*, u.username as created_by 
              FROM feature_requests fr 
              JOIN users u ON fr.user_id = u.id 
              WHERE fr.id = ?`,
            [result.insertId]
        );

        let warning = null;

        // Fetch Settings for Integrations (Ntfy & GitHub)
        let appSettings = {};
        try {
            const [settingsRows] = await db.promise().query(
                "SELECT `key`, value FROM settings WHERE `key` IN ('github_enabled', 'github_repo', 'github_token', 'ntfy_enabled', 'ntfy_server_url', 'ntfy_topic', 'ntfy_sa_id', 'ntfy_sa_secret', 'ignore_env_integrations')"
            );
            appSettings = settingsRows.reduce((acc, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});
        } catch (settingsErr) {
            console.error('Failed to fetch integration settings:', settingsErr);
        }

        const ignoreEnv = appSettings.ignore_env_integrations === 'true';

        // Send notification to ntfy
        try {
            // Check if Ntfy is enabled via DB or if a topic is set in ENV (legacy fallback)
            const ntfyEnabled = appSettings.ntfy_enabled === 'true' || (!ignoreEnv && !appSettings.ntfy_enabled && process.env.NTFY_TOPIC);

            if (ntfyEnabled) {
                const ntfyTopic = appSettings.ntfy_topic || (!ignoreEnv ? process.env.NTFY_TOPIC : null) || 'bookboss_feature_requests';
                const serverUrl = appSettings.ntfy_server_url || (!ignoreEnv ? process.env.NTFY_SERVER_URL : null) || 'https://ntfy.sh';
                const baseUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
                const ntfyUrl = `${baseUrl}/${ntfyTopic}`;

                const headers = {
                    'Title': `BookBoss ${reqType === 'bug' ? 'Bug Report' : 'Feature Request'}`,
                    'Tags': reqType === 'bug' ? 'bug' : 'bulb',
                    'Priority': 'default'
                };

                const saId = appSettings.ntfy_sa_id || (!ignoreEnv ? process.env.NTFY_SA_ID : null);
                if (saId) {
                    const parts = saId.split(':');
                    if (parts.length >= 2) {
                        headers[parts[0].trim()] = parts.slice(1).join(':').trim();
                    }
                }

                const saSecret = appSettings.ntfy_sa_secret || (!ignoreEnv ? process.env.NTFY_SA_SECRET : null);
                if (saSecret) {
                    const parts = saSecret.split(':');
                    if (parts.length >= 2) {
                        headers[parts[0].trim()] = parts.slice(1).join(':').trim();
                    }
                }

                await axios.post(ntfyUrl, `New ${reqType === 'bug' ? 'Bug Report' : 'Feature Request'}: ${title.trim()}\n\n${description || 'No description provided.'}`, {
                    headers: headers
                });
                console.log(`Notification sent to ${ntfyUrl}`);
            }
        } catch (ntfyError) {
            console.error('Failed to send ntfy notification:', ntfyError.message);
            warning = 'Suggestion saved, but failed to notify admin (NTFY unavailable).';
        }

        // GitHub Integration
        try {
            const targetRepo = appSettings.github_repo || (!ignoreEnv ? process.env.GITHUB_REPO : null) || 'daedaebae/BookBoss';
            const targetToken = appSettings.github_token || (!ignoreEnv ? process.env.GITHUB_TOKEN : null);

            if (appSettings.github_enabled === 'true' && targetToken) {
                const ghPrefix = reqType === 'bug' ? '[Bug]' : '[Feature]';
                const response = await axios.post(
                    `https://api.github.com/repos/${targetRepo}/issues`,
                    {
                        title: `${ghPrefix} ${title.trim()}`,
                        body: `${description || 'No description provided.'}\n\n*Requested by @${newFeature[0].created_by} via BookBoss*`
                    },
                    {
                        headers: {
                            'Authorization': `token ${targetToken}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );
                console.log(`Created GitHub Issue: ${response.data.html_url}`);
            }
        } catch (ghError) {
            console.error('Failed to create GitHub issue:', ghError.response ? ghError.response.data : ghError.message);
            if (!warning) warning = 'Suggestion saved, but failed to sync to GitHub.';
        }

        res.status(201).json({
            ...newFeature[0],
            vote_count: 1,
            voted_by_me: true,
            warning: warning
        });
    } catch (error) {
        console.error('Error creating feature:', error);
        res.status(500).json({ error: 'Failed to create feature request' });
    }
};

const voteFeature = async (req, res) => {
    const userId = req.user.id;
    const featureId = req.params.id;

    try {
        const [existing] = await db.promise().query(
            'SELECT 1 FROM feature_votes WHERE user_id = ? AND feature_request_id = ?',
            [userId, featureId]
        );

        let voted = false;
        if (existing.length > 0) {
            await db.promise().query(
                'DELETE FROM feature_votes WHERE user_id = ? AND feature_request_id = ?',
                [userId, featureId]
            );
            voted = false;
        } else {
            await db.promise().query(
                'INSERT INTO feature_votes (user_id, feature_request_id) VALUES (?, ?)',
                [userId, featureId]
            );
            voted = true;
        }

        const [countResult] = await db.promise().query(
            'SELECT COUNT(*) as count FROM feature_votes WHERE feature_request_id = ?',
            [featureId]
        );

        res.json({
            success: true,
            voted: voted,
            new_count: countResult[0].count
        });

    } catch (error) {
        console.error('Error voting on feature:', error);
        res.status(500).json({ error: 'Failed to toggle vote' });
    }
};

const updateFeature = async (req, res) => {
    const featureId = req.params.id;
    const { status, admin_note } = req.body;

    // Admin Check
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Only admins can update features' });
    }

    const validStatuses = ['open', 'planned', 'in_progress', 'completed', 'rejected'];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        // Build query dynamically based on what's provided
        let query = 'UPDATE feature_requests SET ';
        const params = [];

        if (status) {
            query += 'status = ?, ';
            params.push(status);
        }

        if (admin_note !== undefined) {
            query += 'admin_note = ?, ';
            params.push(admin_note);
        }

        // Remove trailing comma and space
        query = query.slice(0, -2);
        query += ' WHERE id = ?';
        params.push(featureId);

        await db.promise().query(query, params);

        // Fetch updated feature to return
        const [updated] = await db.promise().query('SELECT * FROM feature_requests WHERE id = ?', [featureId]);
        const updatedFeature = updated[0];

        if (status) {
            try {
                await db.promise().query(
                    `INSERT INTO notifications 
                    (title, message, type, is_global, target_user_id, created_by) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        `Feature Status Change`,
                        `Your feature request "${updatedFeature.title}" is now marked as: ${status}.`,
                        'info',
                        false,
                        updatedFeature.user_id,
                        req.user.id
                    ]
                );
            } catch (err) {
                console.error('Failed to notify user about feature status update', err);
            }
        }

        res.json({ success: true, message: 'Feature updated', feature: updatedFeature });
    } catch (error) {
        console.error('Error updating feature:', error);
        res.status(500).json({ error: 'Failed to update feature' });
    }
};

module.exports = {
    getFeatureRequests,
    createFeatureRequest,
    voteFeature,
    updateFeature
};
