const Joi = require('joi');

const supplierBaseSchema = {
    name: Joi.string().min(1).max(100).required(),
    contactPerson: Joi.string().max(100).allow('', null).optional(),
    email: Joi.string().email().max(100).allow('', null).optional(),
    phone: Joi.string().max(20).allow('', null).optional(),
    address: Joi.string().max(500).allow('', null).optional(),
};

const createSupplierSchema = Joi.object({
    ...supplierBaseSchema,
});

const updateSupplierSchema = Joi.object({
    name: supplierBaseSchema.name.optional(),
    contactPerson: supplierBaseSchema.contactPerson.optional(),
    email: supplierBaseSchema.email.optional(),
    phone: supplierBaseSchema.phone.optional(),
    address: supplierBaseSchema.address.optional(),
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
    createSupplierSchema,
    updateSupplierSchema,
    validateRequest,
};