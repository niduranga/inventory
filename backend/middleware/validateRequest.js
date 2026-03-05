const logger = require('../config/logger');

// A generic validation middleware to be used with Joi schemas
const validateRequest = (schema) => (req, res, next) => {
    const options = {
        abortEarly: false, // Include all errors
        allowUnknown: true, // Allow unknown props that will be stripped
        stripUnknown: true, // Strip unknown props
    };

    const { error, value } = schema.validate(req.body, options);

    if (error) {
        logger.warn(`Validation error for ${req.method} ${req.originalUrl}: ${error.details.map(x => x.message).join('; ')}`);
        return res.status(400).json({
            message: error.details.map(x => x.message).join('; '),
            details: error.details
        });
    } else {
        req.body = value; // Replace req.body with validated and stripped value
        next();
    }
};

module.exports = { validateRequest };