const Joi = require('joi');

const createShopSchema = Joi.object({
    shopName: Joi.string().min(3).max(100).required(),
    currency: Joi.string().max(10).default('USD'),
    taxRate: Joi.number().min(0).max(100).default(0),
    address: Joi.string().max(500).allow('', null),
    timezone: Joi.string().max(50).default('UTC'),
    subscriptionPlan: Joi.string().valid('free', 'basic', 'premium', 'enterprise').default('basic'),
});

const updateShopSchema = Joi.object({
    shopName: Joi.string().min(3).max(100).optional(),
    currency: Joi.string().max(10).optional(),
    taxRate: Joi.number().min(0).max(100).optional(),
    address: Joi.string().max(500).allow('', null).optional(),
    timezone: Joi.string().max(50).optional(),
    subscriptionPlan: Joi.string().valid('free', 'basic', 'premium', 'enterprise').optional(),
}).min(1);

module.exports = {
    createShopSchema,
    updateShopSchema,
};