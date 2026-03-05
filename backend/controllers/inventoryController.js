const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const logger = require('../config/logger');
const mongoose = require('mongoose');
const { stockInSchema, stockOutSchema, adjustStockSchema, getStockHistorySchema } = require('../validations/inventoryValidation');
const { checkAndNotifyLowStock, checkAndNotifyExpiration } = require('./notificationController'); // Import notification helper

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

const stockIn = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { error, value } = stockInSchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during stock in: ${error.details[0].message}`);
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: error.details[0].message });
        }

        const { productId, quantity, reason, referenceType, referenceId } = value;
        const shopId = req.user.shopId;
        const createdBy = req.user._id;

        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot perform stock in.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'Only owners and managers can perform stock in operations.' });
        }

        const product = await Product.findOne({ _id: productId, shopId: shopId, isActive: true }).session(session);

        if (!product) {
            logger.warn(`Stock in failed: Product ${productId} not found or inactive in shop ${shopId}.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Product not found or is inactive in this shop.' });
        }

        const previousStock = product.stockQuantity;
        const newStock = previousStock + quantity;

        product.stockQuantity = newStock;
        await product.save({ session });

        await recordStockMovement(productId, shopId, createdBy, 'STOCK_IN', quantity, previousStock, newStock, reason, referenceType, referenceId, session);

        // Check for low stock after stock in if minStockLevel is relevant (e.g., if stock was very low, then increased, but still below new min)
        // Or if minStockLevel itself was just updated. For simplicity, we'll focus on outbound movements for low stock.
        // await checkAndNotifyLowStock(product, shopId, createdBy, session); // Consider if needed here

        await session.commitTransaction();
        session.endSession();

        logger.info(`Stock IN successful: Product ${productId} (${product.name}), Quantity: ${quantity}. New stock: ${newStock}.`);
        res.status(200).json({
            message: 'Stock added successfully',
            productId: productId,
            previousStock: previousStock,
            newStock: newStock,
            quantityAdded: quantity,
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.error(`Error performing stock in for product ${req.body.productId}: ${error.message}`);
        res.status(500).json({ message: 'Server error performing stock in operation' });
    }
};

const stockOut = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { error, value } = stockOutSchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during stock out: ${error.details[0].message}`);
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: error.details[0].message });
        }

        const { productId, quantity, reason, referenceType, referenceId } = value;
        const shopId = req.user.shopId;
        const createdBy = req.user._id;

        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot perform stock out.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'Only owners and managers can perform stock out operations.' });
        }

        const product = await Product.findOne({ _id: productId, shopId: shopId, isActive: true }).session(session);

        if (!product) {
            logger.warn(`Stock out failed: Product ${productId} not found or inactive in shop ${shopId}.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Product not found or is inactive in this shop.' });
        }

        const previousStock = product.stockQuantity;
        const newStock = previousStock - quantity;

        if (newStock < 0) {
            logger.warn(`Stock out failed: Insufficient stock for product ${productId} (${product.name}). Requested: ${quantity}, Available: ${previousStock}.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: `Insufficient stock. Cannot remove ${quantity} units. Available: ${previousStock}.` });
        }

        product.stockQuantity = newStock;
        await product.save({ session });

        await recordStockMovement(productId, shopId, createdBy, 'STOCK_OUT', quantity, previousStock, newStock, reason, referenceType, referenceId, session);
        await checkAndNotifyLowStock(product, shopId, createdBy, session); // Check for low stock after stock out

        await session.commitTransaction();
        session.endSession();

        logger.info(`Stock OUT successful: Product ${productId} (${product.name}), Quantity: ${quantity}. New stock: ${newStock}.`);
        res.status(200).json({
            message: 'Stock removed successfully',
            productId: productId,
            previousStock: previousStock,
            newStock: newStock,
            quantityRemoved: quantity,
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.error(`Error performing stock out for product ${req.body.productId}: ${error.message}`);
        res.status(500).json({ message: 'Server error performing stock out operation' });
    }
};

const adjustStock = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { error, value } = adjustStockSchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during stock adjustment: ${error.details[0].message}`);
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: error.details[0].message });
        }

        const { productId, quantity, reason, referenceType, referenceId } = value;
        const shopId = req.user.shopId;
        const createdBy = req.user._id;

        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot perform stock adjustment.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'Only owners and managers can perform stock adjustment operations.' });
        }

        const product = await Product.findOne({ _id: productId, shopId: shopId, isActive: true }).session(session);

        if (!product) {
            logger.warn(`Stock adjustment failed: Product ${productId} not found or inactive in shop ${shopId}.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Product not found or is inactive in this shop.' });
        }

        const previousStock = product.stockQuantity;
        let newStock = previousStock + quantity;

        if (newStock < 0) {
            logger.warn(`Stock adjustment failed: Insufficient stock for product ${productId} (${product.name}). Adjustment: ${quantity}, Available: ${previousStock}.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: `Insufficient stock. Adjustment results in negative stock. Available: ${previousStock}.` });
        }

        product.stockQuantity = newStock;
        await product.save({ session });

        await recordStockMovement(productId, shopId, createdBy, 'ADJUSTMENT', quantity, previousStock, newStock, reason, referenceType || 'ADJUSTMENT', referenceId, session);
        await checkAndNotifyLowStock(product, shopId, createdBy, session); // Check for low stock after adjustment

        await session.commitTransaction();
        session.endSession();

        logger.info(`Stock adjustment successful: Product ${productId} (${product.name}), Adjustment: ${quantity}. New stock: ${newStock}.`);
        res.status(200).json({
            message: 'Stock adjusted successfully',
            productId: productId,
            previousStock: previousStock,
            newStock: newStock,
            adjustment: quantity,
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.error(`Error performing stock adjustment for product ${req.body.productId}: ${error.message}`);
        res.status(500).json({ message: 'Server error performing stock adjustment operation' });
    }
};

const getStockHistory = async (req, res, next) => {
    try {
        if (!req.user || !req.user.shopId) {
            logger.warn(`Get stock history: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const shopId = req.user.shopId;

        if (req.user.role === 'staff') {
            logger.warn(`User ${req.user.email} (Staff) accessing stock history for shop ${shopId}.`);
        } else if (req.user.role !== 'owner' && req.user.role !== 'manager' && req.user.role !== 'superadmin') {
            logger.error(`Authorization error: Unexpected user role ${req.user.role} accessing stock history.`);
            return res.status(403).json({ message: 'Unauthorized access to stock history.' });
        }

        const query = { shopId: shopId };

        if (req.query.productId) {
            query.productId = req.query.productId;
        }

        if (req.query.type) {
            query.type = req.query.type;
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
                query.createdAt = dateFilter;
            }
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let historyQuery = StockMovement.find(query)
            .populate('productId', 'name sku')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        const totalMovements = await StockMovement.countDocuments(query);
        const movements = await historyQuery.skip(skip).limit(limit);

        const totalPages = Math.ceil(totalMovements / limit);

        logger.info(`Retrieved ${movements.length} stock movements for shop ${shopId} (Page: ${page}, Limit: ${limit}). Total found: ${totalMovements}.`);

        res.status(200).json({
            movements,
            pagination: {
                currentPage: page,
                limit: limit,
                totalDocs: totalMovements,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null,
            }
        });

    } catch (error) {
        logger.error(`Error fetching stock history for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching stock history' });
    }
};

const getProductStockHistory = async (req, res, next) => {
    try {
        const productId = req.params.productId;

        if (!req.user || !req.user.shopId) {
            logger.warn(`Get product stock history: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const shopId = req.user.shopId;

        if (req.user.role === 'staff') {
            logger.warn(`User ${req.user.email} (Staff) accessing stock history for product ${productId} in shop ${shopId}.`);
        } else if (req.user.role !== 'owner' && req.user.role !== 'manager' && req.user.role !== 'superadmin') {
            logger.error(`Authorization error: Unexpected user role ${req.user.role} accessing product stock history.`);
            return res.status(403).json({ message: 'Unauthorized access to stock history.' });
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            logger.warn(`Invalid Product ID format for product stock history: ${productId}`);
            return res.status(400).json({ message: 'Invalid Product ID format.' });
        }
        
        const product = await Product.findOne({ _id: productId, shopId: shopId, isActive: true });
        if (!product) {
            logger.warn(`Product stock history request failed: Product ${productId} not found or inactive in shop ${shopId}.`);
            return res.status(404).json({ message: 'Product not found or is inactive in this shop.' });
        }

        const query = { productId: productId, shopId: shopId };

        if (req.query.type) {
            query.type = req.query.type;
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
                query.createdAt = dateFilter;
            }
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let historyQuery = StockMovement.find(query)
            .populate('createdBy', 'name email')
            .populate('productId', 'name sku')
            .sort({ createdAt: -1 });

        const totalMovements = await StockMovement.countDocuments(query);
        const movements = await historyQuery.skip(skip).limit(limit);

        const totalPages = Math.ceil(totalMovements / limit);

        logger.info(`Retrieved ${movements.length} stock movements for product ${productId} in shop ${shopId} (Page: ${page}, Limit: ${limit}). Total found: ${totalMovements}.`);

        res.status(200).json({
            product: {
                _id: product._id,
                name: product.name,
                sku: product.sku,
                currentStock: product.stockQuantity
            },
            movements,
            pagination: {
                currentPage: page,
                limit: limit,
                totalDocs: totalMovements,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null,
            }
        });

    } catch (error) {
        logger.error(`Error fetching product stock history for product ${req.params.productId} in shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching product stock history' });
    }
};

module.exports = {
    recordStockMovement,
    stockIn,
    stockOut,
    adjustStock,
    getStockHistory,
    getProductStockHistory,
};