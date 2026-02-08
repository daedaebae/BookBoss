// server/src/config/env.js
const requiredVars = [
    'MYSQL_USER',
    'MYSQL_PASSWORD',
    'MYSQL_DATABASE',
    'JWT_SECRET'
];

const missingVars = requiredVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
    console.error(`CRITICAL ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please ensure these are set in your .env file or environment.');
    process.exit(1);
}

// Check for default/insecure values in production (optional warning)
if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'change_me_jwt_secret_key_ensure_this_is_long_and_random') {
        console.warn('SECURITY WARNING: You are using the default JWT_SECRET in production. Please rotate this secret immediately.');
    }
}

console.log('Environment variables validated successfully.');
