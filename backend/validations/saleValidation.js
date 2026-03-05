const Joi = require('joi');

const saleProductItemSchema = Joi.object({
    productId: Joi.string().hex().length(24).required(),
    quantity: Joi.number().integer().positive().required(),
    sellingPrice: Joi.number().min(0).required(),
});

const saleBaseSchema = {
    products: Joi.array().items(saleProductItemSchema).min(1).required(),
    taxAmount: Joi.number().min(0).optional().default(0),
    discount: Joi.number().min(0).optional().default(0),
    paymentMethod: Joi.string().valid('CASH', 'CARD', 'ONLINE').required(),
    paymentStatus: Joi.string().valid('PAID', 'PENDING', 'FAILED').optional().default('PENDING'),
    customerName: Joi.string().max(100).allow('', null).optional(),
};

const createSaleSchema = Joi.object({
    ...saleBaseSchema,
});

const updateSaleSchema = Joi.object({
    paymentStatus: Joi.string().valid('PAID', 'PENDING', 'FAILED').optional(),
    customerName: Joi.string().max(100).allow('', null).optional(),
    notes: Joi.string().max(1000).allow('', null).optional(),
}).min(1);

const getSalesSchema = Joi.object({
    paymentStatus: Joi.string().valid('PAID', 'PENDING', 'FAILED').optional(),
    paymentMethod: Joi.string().valid('CASH', 'CARD', 'ONLINE').optional(),
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
    createSaleSchema,
    updateSaleSchema,
    getSalesSchema,
    validateRequest,
};