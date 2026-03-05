const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    // role is handled by the backend logic, not directly exposed for general registration
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

const inviteUserSchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid('owner', 'manager', 'staff').required(),
});

const updateUserSchema = Joi.object({
    name: Joi.string().min(3).max(50).optional(),
    email: Joi.string().email().optional(),
    role: Joi.string().valid('owner', 'manager', 'staff').optional(),
    isActive: Joi.boolean().optional(),
}).min(1);

module.exports = {
    registerSchema,
    loginSchema,
    inviteUserSchema,
    updateUserSchema,
};