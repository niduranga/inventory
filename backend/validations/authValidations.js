const Joi = require('joi');

// Schema for user registration
const registerSchema = Joi.object({
    name: Joi.string().min(3).max(50).required().messages({
        'string.base': 'Name should be a string',
        'string.min': 'Name must be at least 3 characters long',
        'string.max': 'Name must be at most 50 characters long',
        'any.required': 'Name is a required field',
    }),
    email: Joi.string().email().required().messages({
        'string.base': 'Email must be a string',
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is a required field',
    }),
    password: Joi.string().min(6).required().messages({
        'string.base': 'Password must be a string',
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is a required field',
    }),
    role: Joi.string().valid('superadmin', 'owner', 'manager', 'staff').default('staff'), // Default to staff if not provided, owner will be assigned during shop creation
});

// Schema for user login
const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.base': 'Email must be a string',
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is a required field',
    }),
    password: Joi.string().min(6).required().messages({
        'string.base': 'Password must be a string',
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is a required field',
    }),
});

module.exports = {
    registerSchema,
    loginSchema,
};
