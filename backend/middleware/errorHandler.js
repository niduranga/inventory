const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
    logger.error(`Unhandled Error: ${err.message}`, err.stack);

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: err.message || 'An unexpected server error occurred.',
        // In development, send stack trace for debugging
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

module.exports = errorHandler;