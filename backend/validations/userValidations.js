const Joi = require('joi');

// Schema for user invitation or creation (excluding sensitive fields like password, role will be handled by admin)
const createUserSchema = Joi.object({
    name: Joi.string().min(3).max(50).required().messages({
        'string.base': 'Name must be a string',
        'string.min': 'Name must be at least 3 characters long',
        'string.max': 'Name must be at most 50 characters long',
        'any.required': 'Name is a required field',
    }),
    email: Joi.string().email().required().messages({
        'string.base': 'Email must be a string',
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is a required field',
    }),
    // Role assignment should typically be handled by an admin via a separate endpoint
    // or explicitly during invitation/creation by privileged users.
    // For this basic schema, we'll assume it's managed by role-based access logic.
    // role: Joi.string().valid('owner', 'manager', 'staff').required(),
});

// Schema for updating a user's details by an admin
const updateUserSchema = Joi.object({
    name: Joi.string().min(3).max(50).optional().messages({
        'string.base': 'Name must be a string',
        'string.min': 'Name must be at least 3 characters long',
        'string.max': 'Name must be at most 50 characters long',
    }),
    email: Joi.string().email().optional().messages({
        'string.base': 'Email must be a string',
        'string.email': 'Email must be a valid email address',
    }),
    role: Joi.string().valid('owner', 'manager', 'staff').optional(), // SuperAdmin role is usually not assignable here
    isActive: Joi.boolean().optional(),
}).min(1); // Ensure at least one field is provided for update

module.exports = {
    createUserSchema,
    updateUserSchema,
};
