const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }), // Log stack traces
        winston.format.splat(),
        winston.format.json(), // Log in JSON format for easier parsing
        winston.format.colorize({ all: true }) // Colorize output for console
    ),
    transports: [
        // Console transport: logs to the console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.errors({ stack: true }),
                winston.format.splat(),
                winston.format.colorize({ all: true }), // Colorize console output
                winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? `\n${info.stack}` : ''}`)
            )
        }),
        // File transport: logs to a file
        new winston.transports.File({
            filename: process.env.LOG_FILE || 'error.log',
            level: 'error', // Log only errors to file
            dirname: 'logs' // Log file goes into the logs directory
        }),
        // Optional: File transport for all logs (e.g., combined.log)
        new winston.transports.File({
            filename: 'combined.log',
            dirname: 'logs'
        })
    ],
    exceptionHandlers: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.errors({ stack: true }),
                winston.format.splat(),
                winston.format.colorize({ all: true }),
                winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? `\n${info.stack}` : ''}`)
            )
        }),
        new winston.transports.File({ filename: 'exceptions.log', dirname: 'logs' })
    ],
    rejectionHandlers: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.errors({ stack: true }),
                winston.format.splat(),
                winston.format.colorize({ all: true }),
                winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? `\n${info.stack}` : ''}`)
            )
        }),
        new winston.transports.File({ filename: 'rejections.log', dirname: 'logs' })
    ]
});

// HTTP request logging middleware
logger.middleware = (req, res, next) => {
    const start = process.hrtime();
    res.on('finish', () => {
        const durationInMilliseconds = getDurationInMilliseconds(start);
        logger.info(`${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duration: ${durationInMilliseconds}ms`);
    });
    next();
};

function getDurationInMilliseconds(start) {
    const NS_PER_SEC = 1e6; // nanoseconds - milliseconds
    const diff = process.hrtime(start);
    return (diff[0] * NS_PER_SEC + diff[1]) / 1000000;
}

module.exports = logger;
