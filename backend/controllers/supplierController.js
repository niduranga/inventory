const Supplier = require('../models/Supplier');
const User = require('../models/User');
const logger = require('../config/logger');
const { createSupplierSchema, updateSupplierSchema } = require('../validations/supplierValidation');

const createSupplier = async (req, res, next) => {
    try {
        const { error, value } = createSupplierSchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during supplier creation: ${error.details[0].message}`);
            return res.status(400).json({ message: error.details[0].message });
        }

        if (!req.user || !req.user.shopId) {
            logger.warn(`Create supplier: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot create suppliers.`);
            return res.status(403).json({ message: 'Only owners and managers can create suppliers.' });
        }

        const { name, contactPerson, email, phone, address } = value;
        const shopId = req.user.shopId;
        const createdBy = req.user._id;

        const existingSupplier = await Supplier.findOne({ name: name, shopId: shopId });
        if (existingSupplier) {
            logger.warn(`Supplier creation failed: Supplier name '${name}' already exists in shop ${shopId}.`);
            return res.status(409).json({ message: `Supplier with name '${name}' already exists in this shop.` });
        }

        const newSupplier = new Supplier({
            name,
            contactPerson,
            email,
            phone,
            address,
            shopId,
            createdBy,
            isActive: true,
        });

        await newSupplier.save();

        logger.info(`Supplier created successfully: "${newSupplier.name}" in shop ${shopId} by user ${createdBy}`);

        res.status(201).json({
            message: 'Supplier created successfully',
            supplier: newSupplier,
        });

    } catch (error) {
        logger.error(`Error creating supplier: ${error.message}`);
        if (error.code === 11000 && error.message.includes('name_1_shopId_1')) {
            return res.status(409).json({ message: `Supplier with name '${req.body.name}' already exists in this shop.` });
        }
        res.status(500).json({ message: 'Server error creating supplier' });
    }
};

const getAllSuppliers = async (req, res, next) => {
    try {
        if (!req.user || !req.user.shopId) {
            logger.warn(`Get all suppliers: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const shopId = req.user.shopId;

        const query = { shopId: shopId, isActive: true };

        if (req.query.search) {
            const searchTerm = req.query.search;
            query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { phone: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let suppliersQuery = Supplier.find(query)
            .populate('createdBy', 'name email')
            .sort({ name: 1 });

        const totalSuppliers = await Supplier.countDocuments(query);
        const suppliers = await suppliersQuery.skip(skip).limit(limit);

        const totalPages = Math.ceil(totalSuppliers / limit);

        logger.info(`Retrieved ${suppliers.length} suppliers for shop ${shopId} (Page: ${page}, Limit: ${limit}). Total found: ${totalSuppliers}.`);

        res.status(200).json({
            suppliers,
            pagination: {
                currentPage: page,
                limit: limit,
                totalDocs: totalSuppliers,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null,
            }
        });

    } catch (error) {
        logger.error(`Error fetching all suppliers for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching suppliers' });
    }
};

const getSupplierById = async (req, res, next) => {
    try {
        const supplierId = req.params.id;

        if (!req.user || !req.user.shopId) {
            logger.warn(`Get supplier by ID: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const supplier = await Supplier.findOne({ _id: supplierId, shopId: req.user.shopId, isActive: true })
            .populate('createdBy', 'name email');

        if (!supplier) {
            logger.warn(`Get supplier by ID: Supplier ${supplierId} not found in shop ${req.user.shopId}.`);
            return res.status(404).json({ message: 'Supplier not found in this shop.' });
        }

        logger.info(`Retrieved supplier ${supplierId} for shop ${req.user.shopId} by user ${req.user.email}.`);
        res.status(200).json(supplier);

    } catch (error) {
        logger.error(`Error fetching supplier ${req.params.id} for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching supplier' });
    }
};

const updateSupplier = async (req, res, next) => {
    try {
        const supplierId = req.params.id;

        const { error, value } = updateSupplierSchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during supplier update for ID ${supplierId}: ${error.details[0].message}`);
            return res.status(400).json({ message: error.details[0].message });
        }

        if (!req.user || !req.user.shopId) {
            logger.warn(`Update supplier: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot update suppliers.`);
            return res.status(403).json({ message: 'Only owners and managers can update suppliers.' });
        }

        const supplierToUpdate = await Supplier.findOne({ _id: supplierId, shopId: req.user.shopId, isActive: true });

        if (!supplierToUpdate) {
            logger.warn(`Update supplier: Supplier ${supplierId} not found in shop ${req.user.shopId}.`);
            return res.status(404).json({ message: 'Supplier not found in this shop.' });
        }

        if (value.name && value.name !== supplierToUpdate.name) {
            const existingSupplier = await Supplier.findOne({ name: value.name, shopId: req.user.shopId, _id: { $ne: supplierId } });
            if (existingSupplier) {
                logger.warn(`Supplier update failed: Supplier name '${value.name}' already exists in shop ${req.user.shopId}.`);
                return res.status(409).json({ message: `Supplier name '${value.name}' is already in use in this shop.` });
            }
        }

        const updatedSupplier = await Supplier.findByIdAndUpdate(supplierId, value, {
            new: true,
            runValidators: true,
        })
        .populate('createdBy', 'name email');

        if (!updatedSupplier) {
            logger.warn(`Update supplier: Supplier ${supplierId} not found during findByIdAndUpdate.`);
            return res.status(404).json({ message: 'Supplier not found.' });
        }

        logger.info(`Supplier "${updatedSupplier.name}" updated successfully by ${req.user.email}.`);
        res.status(200).json(updatedSupplier);

    } catch (error) {
        logger.error(`Error updating supplier ${req.params.id}: ${error.message}`);
        if (error.code === 11000 && error.message.includes('name_1_shopId_1')) {
            return res.status(409).json({ message: `Supplier name '${req.body.name}' already exists in this shop.` });
        }
        res.status(500).json({ message: 'Server error updating supplier' });
    }
};

const deleteSupplier = async (req, res, next) => {
    try {
        const supplierId = req.params.id;

        if (!req.user || !req.user.shopId) {
            logger.warn(`Delete supplier: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot delete suppliers.`);
            return res.status(403).json({ message: 'Only owners and managers can delete suppliers.' });
        }

        const supplierToDelete = await Supplier.findOne({ _id: supplierId, shopId: req.user.shopId, isActive: true });

        if (!supplierToDelete) {
            logger.warn(`Delete supplier: Supplier ${supplierId} not found or already inactive in shop ${req.user.shopId}.`);
            return res.status(404).json({ message: 'Supplier not found or already deactivated in this shop.' });
        }
        
        const deletedSupplier = await Supplier.findByIdAndUpdate(supplierId, { isActive: false }, {
            new: true,
            runValidators: true,
        })
        .populate('createdBy', 'name email');

        if (!deletedSupplier) {
            logger.warn(`Delete supplier: Supplier ${supplierId} not found during findByIdAndUpdate for soft delete.`);
            return res.status(404).json({ message: 'Supplier not found.' });
        }

        logger.warn(`Supplier "${deletedSupplier.name}" soft-deleted by ${req.user.email}.`);
        res.status(200).json({
            message: 'Supplier has been deactivated successfully.',
            supplier: deletedSupplier,
        });

    } catch (error) {
        logger.error(`Error soft-deleting supplier ${req.params.id}: ${error.message}`);
        res.status(500).json({ message: 'Server error deactivating supplier' });
    }
};

module.exports = {
    createSupplier,
    getAllSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier,
};