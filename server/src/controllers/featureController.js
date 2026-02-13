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
    const { title, description } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const [result] = await db.promise().query(
            'INSERT INTO feature_requests (user_id, title, description) VALUES (?, ?, ?)',
            [userId, title.trim(), description || '']
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

        // Send notification to ntfy
        try {
            const ntfyTopic = process.env.NTFY_TOPIC || 'bookboss_feature_requests';
            const serverUrl = process.env.NTFY_SERVER_URL || 'https://ntfy.philemonsgarden.com';
            const baseUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
            const ntfyUrl = `${baseUrl}/${ntfyTopic}`;

            await axios.post(ntfyUrl, `New Feature Request: ${title.trim()}\n\n${description || 'No description provided.'}`, {
                headers: {
                    'Title': 'BookBoss Feature Request',
                    'Tags': 'bulb,bookboss',
                    'Priority': 'default'
                }
            });
            console.log(`Notification sent to ${ntfyUrl}`);
        } catch (ntfyError) {
            console.error('Failed to send ntfy notification:', ntfyError.message);
            warning = 'Suggestion saved, but failed to notify admin (NTFY unavailable).';
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
            'SELECT id FROM feature_votes WHERE user_id = ? AND feature_request_id = ?',
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

const updateFeatureStatus = async (req, res) => {
    const featureId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['open', 'planned', 'in_progress', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        await db.promise().query(
            'UPDATE feature_requests SET status = ? WHERE id = ?',
            [status, featureId]
        );
        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        console.error('Error updating feature status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};

module.exports = {
    getFeatureRequests,
    createFeatureRequest,
    voteFeature,
    updateFeatureStatus
};
