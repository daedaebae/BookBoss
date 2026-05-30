import db from './db';
import logger from '../utils/logger';

export async function seedAbsServer(): Promise<void> {
    const serverUrl = process.env.ABS_SERVER_URL?.trim();
    const apiKey = process.env.ABS_API_KEY?.trim();
    const serverName = process.env.ABS_SERVER_NAME?.trim() || 'Audiobookshelf';

    if (!serverUrl || !apiKey) return;

    try {
        new URL(serverUrl);
    } catch {
        logger.warn('ABS_SERVER_URL is not a valid URL — skipping ABS seed.');
        return;
    }

    try {
        const pool = db.promise();

        const [adminRows]: any = await pool.query(
            'SELECT id FROM users WHERE is_admin = TRUE ORDER BY id ASC LIMIT 1'
        );
        if (!adminRows?.length) {
            logger.warn('ABS seed: no admin user found, skipping.');
            return;
        }
        const adminId = adminRows[0].id;

        const [existing]: any = await pool.query(
            'SELECT id FROM audiobookshelf_servers WHERE user_id = ? AND server_url = ?',
            [adminId, serverUrl]
        );
        if (existing?.length) {
            logger.info('ABS seed: server already registered for admin, skipping.');
            return;
        }

        await pool.query(
            'INSERT INTO audiobookshelf_servers (user_id, server_name, server_url, api_token) VALUES (?, ?, ?, ?)',
            [adminId, serverName, serverUrl, apiKey]
        );
        logger.info(`ABS seed: registered "${serverName}" (${serverUrl}) for admin.`);
    } catch (err: any) {
        logger.warn(`ABS seed: failed — ${err.message}`);
    }
}
