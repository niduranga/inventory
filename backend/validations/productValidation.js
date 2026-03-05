const Joi = require('joi');

const productBaseSchema = {
    name: Joi.string().min(1).max(255).required(),
    sku: Joi.string().min(1).max(100).required(),
    barcode: Joi.string().max(100).allow('', null).optional(),
    categoryId: Joi.string().hex().length(24).required(),
    supplierId: Joi.string().hex().length(24).required(),
    purchasePrice: Joi.number().min(0).required(),
    sellingPrice: Joi.number().min(0).required(),
    stockQuantity: Joi.number().min(0).required(),
    minStockLevel: Joi.number().min(0).optional().default(0),
    description: Joi.string().max(1000).allow('', null).optional(),
    productImage: Joi.string().uri().allow('', null).optional(),
    expirationDate: Joi.date().allow('', null).optional(),
};

const createProductSchema = Joi.object({
    ...productBaseSchema,
});

const updateProductSchema = Joi.object({
    name: productBaseSchema.name.optional(),
    sku: productBaseSchema.sku.optional(),
    barcode: productBaseSchema.barcode.optional(),
    categoryId: productBaseSchema.categoryId.optional(),
    supplierId: productBaseSchema.supplierId.optional(),
    purchasePrice: productBaseSchema.purchasePrice.optional(),
    sellingPrice: productBaseSchema.sellingPrice.optional(),
    stockQuantity: productBaseSchema.stockQuantity.optional(),
    minStockLevel: productBaseSchema.minStockLevel.optional(),
    description: productBaseSchema.description.optional(),
    productImage: productBaseSchema.productImage.optional(),
    expirationDate: productBaseSchema.expirationDate.optional(),
}).min(1);

// Helper for general validation (used in routes)
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
    createProductSchema,
    updateProductSchema,
    validateRequest,
};