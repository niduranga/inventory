const Joi = require('joi');

// Schema for creating a shop
const createShopSchema = Joi.object({
    shopName: Joi.string().min(3).max(100).required().messages({
        'string.base': 'Shop name must be a string',
        'string.min': 'Shop name must be at least 3 characters long',
        'string.max': 'Shop name must be at most 100 characters long',
        'any.required': 'Shop name is a required field',
    }),
    currency: Joi.string().max(10).default('USD'),
    taxRate: Joi.number().min(0).max(100).default(0),
    address: Joi.string().max(500).allow('', null),
    timezone: Joi.string().max(50).default('UTC'),
    subscriptionPlan: Joi.string().valid('free', 'basic', 'premium').default('basic'),
    // ownerId will be set from the authenticated user in the controller
});

// Schema for updating a shop (fields can be optional)
const updateShopSchema = Joi.object({
    shopName: Joi.string().min(3).max(100).optional().messages({
        'string.base': 'Shop name must be a string',
        'string.min': 'Shop name must be at least 3 characters long',
        'string.max': 'Shop name must be at most 100 characters long',
    }),
    currency: Joi.string().max(10).optional().default('USD'),
    taxRate: Joi.number().min(0).max(100).optional().default(0),
    address: Joi.string().max(500).allow('', null).optional(),
    timezone: Joi.string().max(50).optional().default('UTC'),
    subscriptionPlan: Joi.string().valid('free', 'basic', 'premium').optional().default('basic'),
}).min(1); // Ensure at least one field is provided for update

module.exports = {
    createShopSchema,
    updateShopSchema,
};
