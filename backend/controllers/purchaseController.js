const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Supplier = require('../models/Supplier');
const logger = require('../config/logger');
const mongoose = require('mongoose');
const { createPurchaseSchema, updatePurchaseSchema, getPurchasesSchema } = require('../validations/purchaseValidation');

const recordStockMovement = async (productId, shopId, createdBy, type, quantity, previousStock, newStock, reason, referenceType = 'OTHER', referenceId = null, session) => {
    try {
        const movement = new StockMovement({
            productId,
            shopId,
            type,
            quantity,
            previousStock,
            newStock,
            reason,
            referenceType,
            referenceId,
            createdBy,
        });
        await movement.save({ session });
        logger.info(`Stock movement recorded: Product ${productId}, Type ${type}, Qty ${quantity}, Prev ${previousStock}, New ${newStock}, Ref ${referenceId || 'N/A'}`);
    } catch (error) {
        logger.error(`Error recording stock movement for product ${productId}: ${error.message}`);
        throw error;
    }
};

const checkReferenceOwnership = async (shopId, refType, refId, session) => {
    let Model;
    switch (refType) {
        case 'category': Model = require('../models/Category'); break;
        case 'supplier': Model = Supplier; break;
        case 'product': Model = Product; break;
        default: return false;
    }
    try {
        const ref = await Model.findOne({ _id: refId, shopId: shopId, isActive: true }).session(session);
        return !!ref;
    } catch (error) {
        logger.warn(`Error checking ownership for ${refType} ID ${refId} in shop ${shopId}: ${error.message}`);
        return false;
    }
};

const createPurchase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { error, value } = createPurchaseSchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during purchase creation: ${error.details[0].message}`);
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: error.details[0].message });
        }

        if (!req.user || !req.user.shopId) {
            logger.warn(`Create purchase: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot create purchases.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'Only owners and managers can create purchases.' });
        }

        const { supplierId, products, purchaseDate, taxAmount, discount, paymentStatus, notes } = value;
        const shopId = req.user.shopId;
        const createdBy = req.user._id;

        let calculatedTotalAmount = 0;
        const purchaseItems = [];

        const supplierExists = await checkReferenceOwnership(shopId, 'supplier', supplierId, session);
        if (!supplierExists) {
            logger.warn(`Purchase creation failed: Supplier ID ${supplierId} not found or not in shop ${shopId}.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Invalid Supplier ID. Supplier not found or does not belong to this shop.' });
        }

        for (const item of products) {
            const productExists = await checkReferenceOwnership(shopId, 'product', item.productId, session);
            if (!productExists) {
                logger.warn(`Purchase creation failed: Product ID ${item.productId} not found or not in shop ${shopId}.`);
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ message: `Invalid Product ID ${item.productId}. Product not found or does not belong to this shop.` });
            }

            const product = await Product.findById(item.productId).session(session);
            if (!product) {
                logger.error(`Product ${item.productId} not found during purchase creation, though ownership check passed.`);
                await session.abortTransaction();
                session.endSession();
                return res.status(500).json({ message: 'Internal error validating product.' });
            }

            const itemTotalPrice = item.quantity * item.purchasePrice;
            calculatedTotalAmount += itemTotalPrice;

            const previousStock = product.stockQuantity;
            const newStock = previousStock + item.quantity;

            product.stockQuantity = newStock;
            await product.save({ session });

            await recordStockMovement(
                item.productId,
                shopId,
                createdBy,
                'STOCK_IN',
                item.quantity,
                previousStock,
                newStock,
                `Purchase ID: ${'TEMP_PURCHASE_ID_PLACEHOLDER'}`,
                'PURCHASE',
                null,
                session
            );

            purchaseItems.push({
                productId: item.productId,
                quantity: item.quantity,
                purchasePrice: item.purchasePrice,
                totalPrice: item.totalPrice,
            });
        }

        let finalAmount = calculatedTotalAmount + taxAmount - discount;
        if (finalAmount < 0) finalAmount = 0;

        const newPurchase = new Purchase({
            shopId,
            supplierId,
            products: purchaseItems,
            totalAmount: calculatedTotalAmount,
            taxAmount,
            discount,
            finalAmount,
            purchaseDate: purchaseDate || Date.now(),
            paymentStatus,
            notes,
            createdBy,
            isActive: true,
        });

        const savedPurchase = await newPurchase.save({ session });

        await StockMovement.updateMany(
            { createdBy: createdBy, productId: { $in: purchaseItems.map(p => p.productId) }, referenceId: null, type: 'STOCK_IN' },
            { $set: { referenceId: savedPurchase._id, reason: `Purchase ID: ${savedPurchase._id}` } },
            { session }
        );

        logger.info(`Purchase created successfully: ID ${savedPurchase._id} for supplier ${supplierId} in shop ${shopId} by ${createdBy}`);

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            message: 'Purchase created successfully',
            purchase: savedPurchase,
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.error(`Error creating purchase: ${error.message}`);
        if (error.code === 11000 && error.message.includes('shopId_1')) {
             return res.status(409).json({ message: 'Purchase creation failed due to a data conflict.' });
        }
        res.status(500).json({ message: 'Server error creating purchase' });
    }
};

const getAllPurchases = async (req, res, next) => {
    try {
        if (!req.user || !req.user.shopId) {
            logger.warn(`Get all purchases: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const shopId = req.user.shopId;

        if (req.user.role === 'staff') {
            logger.warn(`User ${req.user.email} (Staff) accessing purchase history for shop ${shopId}.`);
        } else if (req.user.role !== 'owner' && req.user.role !== 'manager' && req.user.role !== 'superadmin') {
            logger.error(`Authorization error: Unexpected user role ${req.user.role} accessing purchase history.`);
            return res.status(403).json({ message: 'Unauthorized access to purchase history.' });
        }

        const query = { shopId: shopId, isActive: true };

        if (req.query.supplierId) {
            query.supplierId = req.query.supplierId;
        }

        if (req.query.paymentStatus) {
            query.paymentStatus = req.query.paymentStatus;
        }

        if (req.query.startDate || req.query.endDate) {
            const dateFilter = {};
            if (req.query.startDate) {
                dateFilter.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                dateFilter.$lte = new Date(req.query.endDate);
            }
            if (Object.keys(dateFilter).length > 0) {
                query.purchaseDate = dateFilter;
            }
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let purchasesQuery = Purchase.find(query)
            .populate('supplierId', 'name contactPerson')
            .populate('createdBy', 'name email')
            .sort({ purchaseDate: -1 });

        const totalPurchases = await Purchase.countDocuments(query);
        const purchases = await purchasesQuery.skip(skip).limit(limit);

        const totalPages = Math.ceil(totalPurchases / limit);

        logger.info(`Retrieved ${purchases.length} purchases for shop ${shopId} (Page: ${page}, Limit: ${limit}). Total found: ${totalPurchases}.`);

        res.status(200).json({
            purchases,
            pagination: {
                currentPage: page,
                limit: limit,
                totalDocs: totalPurchases,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null,
            }
        });

    } catch (error) {
        logger.error(`Error fetching purchases for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching purchases' });
    }
};

const getPurchaseById = async (req, res, next) => {
    try {
        const purchaseId = req.params.id;

        if (!req.user || !req.user.shopId) {
            logger.warn(`Get purchase by ID: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const purchase = await Purchase.findOne({ _id: purchaseId, shopId: req.user.shopId, isActive: true })
            .populate('supplierId', 'name contactPerson')
            .populate('createdBy', 'name email')
            .populate('products.productId', 'name sku');

        if (!purchase) {
            logger.warn(`Get purchase by ID: Purchase ${purchaseId} not found in shop ${req.user.shopId}.`);
            return res.status(404).json({ message: 'Purchase not found in this shop.' });
        }

        if (req.user.role === 'staff') {
        }

        logger.info(`Retrieved purchase ${purchaseId} for shop ${req.user.shopId} by user ${req.user.email}.`);
        res.status(200).json(purchase);

    } catch (error) {
        logger.error(`Error fetching purchase ${req.params.id} for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching purchase' });
    }
};

const updatePurchase = async (req, res, next) => {
    try {
        const purchaseId = req.params.id;

        const { error, value } = updatePurchaseSchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during purchase update for ID ${purchaseId}: ${error.details[0].message}`);
            return res.status(400).json({ message: error.details[0].message });
        }

        if (!req.user || !req.user.shopId) {
            logger.warn(`Update purchase: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot update purchases.`);
            return res.status(403).json({ message: 'Only owners and managers can update purchases.' });
        }

        const purchaseToUpdate = await Purchase.findOne({ _id: purchaseId, shopId: req.user.shopId, isActive: true });

        if (!purchaseToUpdate) {
            logger.warn(`Update purchase: Purchase ${purchaseId} not found in shop ${req.user.shopId}.`);
            return res.status(404).json({ message: 'Purchase not found in this shop.' });
        }

        if (value.products && value.products.length > 0) {
             logger.warn(`Update purchase: Attempt to modify product list for purchase ${purchaseId}. This is not allowed.`);
             return res.status(400).json({ message: 'Modifying product details in an existing purchase is not allowed. Create a new purchase or adjustment if needed.' });
        }

        const updatedPurchase = await Purchase.findByIdAndUpdate(purchaseId, value, {
            new: true,
            runValidators: true,
        })
        .populate('supplierId', 'name contactPerson')
        .populate('createdBy', 'name email');

        if (!updatedPurchase) {
            logger.warn(`Update purchase: Purchase ${purchaseId} not found during findByIdAndUpdate.`);
            return res.status(404).json({ message: 'Purchase not found.' });
        }

        logger.info(`Purchase ${updatedPurchase._id} updated successfully by ${req.user.email}.`);
        res.status(200).json(updatedPurchase);

    } catch (error) {
        logger.error(`Error updating purchase ${req.params.id}: ${error.message}`);
        res.status(500).json({ message: 'Server error updating purchase' });
    }
};

const deletePurchase = async (req, res, next) => {
    try {
        const purchaseId = req.params.id;

        if (!req.user || !req.user.shopId) {
            logger.warn(`Delete purchase: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot delete purchases.`);
            return res.status(403).json({ message: 'Only owners and managers can delete purchases.' });
        }

        const purchaseToDelete = await Purchase.findOne({ _id: purchaseId, shopId: req.user.shopId, isActive: true });

        if (!purchaseToDelete) {
            logger.warn(`Delete purchase: Purchase ${purchaseId} not found or already inactive in shop ${req.user.shopId}.`);
            return res.status(404).json({ message: 'Purchase not found or already deactivated in this shop.' });
        }
        
        const deletedPurchase = await Purchase.findByIdAndUpdate(purchaseId, { isActive: false }, {
            new: true,
            runValidators: true,
        })
        .populate('supplierId', 'name contactPerson')
        .populate('createdBy', 'name email');

        if (!deletedPurchase) {
            logger.warn(`Delete purchase: Purchase ${purchaseId} not found during findByIdAndUpdate for soft delete.`);
            return res.status(404).json({ message: 'Purchase not found.' });
        }

        logger.warn(`Purchase ${deletedPurchase._id} soft-deleted by ${req.user.email}. Inventory impact NOT reversed.`);
        res.status(200).json({
            message: 'Purchase has been deactivated successfully. Inventory impact was not reversed.',
            purchase: deletedPurchase,
        });

    } catch (error) {
        logger.error(`Error soft-deleting purchase ${req.params.id}: ${error.message}`);
        res.status(500).json({ message: 'Server error deactivating purchase' });
    }
};

module.exports = {
    createPurchase,
    getAllPurchases,
    getPurchaseById,
    updatePurchase,
    deletePurchase,
};