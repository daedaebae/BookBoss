// server/src/config/env.js
import logger from '../utils/logger';

const requiredVars = [
    'MYSQL_USER',
    'MYSQL_PASSWORD',
    'MYSQL_DATABASE',
    'JWT_SECRET'
];

const missingVars = requiredVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
    logger.error(`CRITICAL ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
    logger.error('Please ensure these are set in your .env file or environment.');
    process.exit(1);
}

// Check for default/insecure values in production
if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'change_me_jwt_secret_key_ensure_this_is_long_and_random') {
        logger.warn('SECURITY WARNING: You are using the default JWT_SECRET in production. Please rotate this secret immediately.');
    }
}

logger.info('Environment variables validated successfully.');
