const Joi = require('joi');

const categoryBaseSchema = {
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).allow('', null).optional(),
};

const createCategorySchema = Joi.object({
    ...categoryBaseSchema,
});

const updateCategorySchema = Joi.object({
    name: categoryBaseSchema.name.optional(),
    description: categoryBaseSchema.description.optional(),
}).min(1);

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
    createCategorySchema,
    updateCategorySchema,
    validateRequest,
};