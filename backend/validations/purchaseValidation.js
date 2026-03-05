const Joi = require('joi');

const productItemSchema = Joi.object({
    productId: Joi.string().hex().length(24).required(),
    quantity: Joi.number().integer().positive().required(),
    purchasePrice: Joi.number().min(0).required(),
});

const purchaseBaseSchema = {
    supplierId: Joi.string().hex().length(24).required(),
    products: Joi.array().items(productItemSchema).min(1).required(),
    purchaseDate: Joi.date().optional(),
    taxAmount: Joi.number().min(0).optional().default(0),
    discount: Joi.number().min(0).optional().default(0),
    paymentStatus: Joi.string().valid('PAID', 'PARTIAL', 'PENDING').optional().default('PENDING'),
    notes: Joi.string().max(1000).allow('', null).optional(),
};

const createPurchaseSchema = Joi.object({
    ...purchaseBaseSchema,
});

const updatePurchaseSchema = Joi.object({
    supplierId: Joi.string().hex().length(24).optional(),
    purchaseDate: Joi.date().optional(),
    taxAmount: Joi.number().min(0).optional(),
    discount: Joi.number().min(0).optional(),
    paymentStatus: Joi.string().valid('PAID', 'PARTIAL', 'PENDING').optional(),
    notes: Joi.string().max(1000).allow('', null).optional(),
}).min(1);

const getPurchasesSchema = Joi.object({
    supplierId: Joi.string().hex().length(24).optional(),
    paymentStatus: Joi.string().valid('PAID', 'PARTIAL', 'PENDING').optional(),
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
    createPurchaseSchema,
    updatePurchaseSchema,
    getPurchasesSchema,
    validateRequest,
};