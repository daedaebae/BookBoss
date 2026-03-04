const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, stack }) => {
                    return `[${timestamp}] ${level}: ${message} ${stack ? '\n' + stack : ''}`;
                })
            )
        }),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

/**
 * Dynamically set the logger level at runtime.
 * Used by the debug mode toggle in Settings.
 * @param {'debug'|'info'|'warn'|'error'} level
 */
logger.setLevel = (level) => {
    const validLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLevels.includes(level)) {
        logger.warn(`setLevel called with invalid level: ${level}`);
        return;
    }
    logger.level = level;
    logger.transports.forEach(t => { t.level = level; });
    logger.info(`Log level changed to: ${level}`);
};

module.exports = logger;
