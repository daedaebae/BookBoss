import db from '../config/db';

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        // Fetch global notifications OR targeted to this user
        // Exclude ones they already acknowledged
        const query = `
            SELECT n.* 
            FROM notifications n
            LEFT JOIN notification_acknowledgements ack ON n.id = ack.notification_id AND ack.user_id = ?
            WHERE (n.is_global = TRUE OR n.target_user_id = ?)
            AND ack.id IS NULL
            AND (n.expires_at IS NULL OR n.expires_at > NOW())
            AND (n.scheduled_for IS NULL OR n.scheduled_for <= NOW())
            ORDER BY n.created_at DESC
        `;
        const [notifications] = await db.promise().query(query, [userId, userId]);
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

export const acknowledgeNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await db.promise().query(
            'INSERT IGNORE INTO notification_acknowledgements (notification_id, user_id) VALUES (?, ?)',
            [id, userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error acknowledging notification:', error);
        res.status(500).json({ error: 'Failed to acknowledge notification' });
    }
};

export const createNotification = async (req, res) => {
    try {
        const {
            title,
            message,
            type = 'info',
            is_global = true,
            target_user_id = null,
            requires_ack = false,
            scheduled_for = null,
            expires_at = null
        } = req.body;

        const created_by = req.user.id;

        const [result] = await db.promise().query(
            `INSERT INTO notifications 
            (title, message, type, is_global, target_user_id, requires_ack, scheduled_for, expires_at, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, message, type, is_global, target_user_id, requires_ack, scheduled_for, expires_at, created_by]
        );

        res.status(201).json({ id: (result as any).insertId, message: 'Notification created successfully' });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await db.promise().query('DELETE FROM notifications WHERE id = ?', [id]);
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};
