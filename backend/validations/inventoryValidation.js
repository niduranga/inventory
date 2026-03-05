const Joi = require('joi');

const stockMovementBaseSchema = {
    productId: Joi.string().hex().length(24).required(),
    quantity: Joi.number().integer().positive().required(),
    reason: Joi.string().max(500).required(),
};

const stockInSchema = Joi.object({
    ...stockMovementBaseSchema,
    referenceType: Joi.valid('PURCHASE', 'ADJUSTMENT', 'OTHER').optional(),
    referenceId: Joi.string().hex().length(24).optional(),
});

const stockOutSchema = Joi.object({
    ...stockMovementBaseSchema,
    referenceType: Joi.valid('SALE', 'ADJUSTMENT', 'OTHER').optional(),
    referenceId: Joi.string().hex().length(24).optional(),
});

const adjustStockSchema = Joi.object({
    productId: stockMovementBaseSchema.productId.required(),
    quantity: Joi.number().integer().required(), // Can be negative for adjustment
    reason: Joi.string().max(500).required(),
    referenceType: Joi.valid('ADJUSTMENT', 'OTHER').optional(),
    referenceId: Joi.string().hex().length(24).optional(),
});

const getStockHistorySchema = Joi.object({
    productId: Joi.string().hex().length(24).optional(),
    type: Joi.string().valid('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
});

const validateRequest = (schema) => {
    return (req, res, next) => {
        const dataToValidate = req.method === 'GET' ? req.query : req.body;
        const { error, value } = schema.validate(dataToValidate);

        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        if (req.method === 'GET') {
            req.query = value;
        } else {
            req.body = value;
        }
        next();
    };
};

module.exports = {
    stockInSchema,
    stockOutSchema,
    adjustStockSchema,
    getStockHistorySchema,
    validateRequest,
};