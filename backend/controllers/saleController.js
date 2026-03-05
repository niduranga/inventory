const Sale = require('../models/Sale');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const logger = require('../config/logger');
const mongoose = require('mongoose');
const { createSaleSchema, updateSaleSchema, getSalesSchema } = require('../validations/saleValidation');

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

const createSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { error, value } = createSaleSchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during sale creation: ${error.details[0].message}`);
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: error.details[0].message });
        }

        if (!req.user || !req.user.shopId) {
            logger.warn(`Create sale: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        if (req.user.role === 'superadmin') {
            logger.warn(`Authorization warning: Superadmin ${req.user.email} attempting to create a sale. This action is usually for staff/managers/owners.`);
        } else if (req.user.role !== 'owner' && req.user.role !== 'manager' && req.user.role !== 'staff') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot create sales.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'You are not authorized to create sales.' });
        }

        const { products, taxAmount, discount, paymentMethod, paymentStatus, customerName, notes } = value;
        const shopId = req.user.shopId;
        const createdBy = req.user._id;

        let calculatedSubtotal = 0;
        const saleItems = [];

        for (const item of products) {
            const product = await Product.findOne({ _id: item.productId, shopId: shopId, isActive: true }).session(session);

            if (!product) {
                logger.warn(`Sale creation failed: Product ${item.productId} not found or inactive in shop ${shopId}.`);
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ message: `Product with ID ${item.productId} not found or inactive in this shop.` });
            }

            const previousStock = product.stockQuantity;
            const itemTotalPrice = item.quantity * item.sellingPrice;

            if (previousStock < item.quantity) {
                logger.warn(`Sale creation failed: Insufficient stock for product ${item.productId} (${product.name}). Requested: ${item.quantity}, Available: ${previousStock}.`);
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${previousStock}. Cannot sell ${item.quantity}.` });
            }

            const newStock = previousStock - item.quantity;
            product.stockQuantity = newStock;
            await product.save({ session });

            await recordStockMovement(
                item.productId,
                shopId,
                createdBy,
                'STOCK_OUT',
                item.quantity,
                previousStock,
                newStock,
                `Sale ID: TEMP_SALE_ID_PLACEHOLDER`,
                'SALE',
                null,
                session
            );

            saleItems.push({
                productId: item.productId,
                quantity: item.quantity,
                sellingPrice: item.sellingPrice,
                totalPrice: itemTotalPrice,
            });
            calculatedSubtotal += itemTotalPrice;
        }

        let finalAmount = calculatedSubtotal + taxAmount - discount;
        if (finalAmount < 0) finalAmount = 0;

        const newSale = new Sale({
            shopId,
            products: saleItems,
            subtotal: calculatedSubtotal,
            taxAmount,
            discount,
            totalAmount: finalAmount,
            paymentMethod,
            paymentStatus,
            customerName,
            notes,
            createdBy,
            isActive: true,
        });

        const savedSale = await newSale.save({ session });

        await StockMovement.updateMany(
            { createdBy: createdBy, productId: { $in: saleItems.map(p => p.productId) }, referenceId: null, type: 'STOCK_OUT' },
            { $set: { referenceId: savedSale._id, reason: `Sale ID: ${savedSale._id}` } },
            { session }
        );

        logger.info(`Sale created successfully: Receipt ${savedSale.receiptNumber} for shop ${shopId} by ${createdBy}`);

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            message: 'Sale created successfully',
            sale: savedSale,
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.error(`Error creating sale: ${error.message}`);
        if (error.code === 11000 && error.message.includes('receiptNumber')) {
            return res.status(409).json({ message: 'Receipt number generation conflict. Please try again.' });
        }
        res.status(500).json({ message: 'Server error creating sale' });
    }
};

const getAllSales = async (req, res, next) => {
    try {
        if (!req.user || !req.user.shopId) {
            logger.warn(`Get all sales: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const shopId = req.user.shopId;

        if (req.user.role === 'staff') {
            logger.warn(`User ${req.user.email} (Staff) accessing sales history for shop ${shopId}.`);
        } else if (req.user.role !== 'owner' && req.user.role !== 'manager' && req.user.role !== 'superadmin') {
            logger.error(`Authorization error: Unexpected user role ${req.user.role} accessing sales history.`);
            return res.status(403).json({ message: 'Unauthorized access to sales history.' });
        }

        const query = { shopId: shopId, isActive: true };

        if (req.query.paymentStatus) {
            query.paymentStatus = req.query.paymentStatus;
        }
        if (req.query.paymentMethod) {
            query.paymentMethod = req.query.paymentMethod;
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

        let salesQuery = Sale.find(query)
            .populate('products.productId', 'name sku')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        const totalSales = await Sale.countDocuments(query);
        const sales = await salesQuery.skip(skip).limit(limit);

        const totalPages = Math.ceil(totalSales / limit);

        logger.info(`Retrieved ${sales.length} sales for shop ${shopId} (Page: ${page}, Limit: ${limit}). Total found: ${totalSales}.`);

        res.status(200).json({
            sales,
            pagination: {
                currentPage: page,
                limit: limit,
                totalDocs: totalSales,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null,
            }
        });

    } catch (error) {
        logger.error(`Error fetching sales for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching sales' });
    }
};

const getSaleById = async (req, res, next) => {
    try {
        const saleId = req.params.id;

        if (!req.user || !req.user.shopId) {
            logger.warn(`Get sale by ID: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const sale = await Sale.findOne({ _id: saleId, shopId: req.user.shopId, isActive: true })
            .populate('products.productId', 'name sku')
            .populate('createdBy', 'name email');

        if (!sale) {
            logger.warn(`Get sale by ID: Sale ${saleId} not found in shop ${req.user.shopId}.`);
            return res.status(404).json({ message: 'Sale not found in this shop.' });
        }

        logger.info(`Retrieved sale ${saleId} for shop ${req.user.shopId} by user ${req.user.email}.`);
        res.status(200).json(sale);

    } catch (error) {
        logger.error(`Error fetching sale ${req.params.id} for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching sale' });
    }
};

const updateSale = async (req, res, next) => {
    try {
        const saleId = req.params.id;

        const { error, value } = updateSaleSchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during sale update for ID ${saleId}: ${error.details[0].message}`);
            return res.status(400).json({ message: error.details[0].message });
        }

        if (!req.user || !req.user.shopId) {
            logger.warn(`Update sale: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        if (req.user.role === 'staff') {
            logger.warn(`Authorization error: Staff user ${req.user.email} cannot update sales.`);
            return res.status(403).json({ message: 'Staff users cannot update sales.' });
        }

        const saleToUpdate = await Sale.findOne({ _id: saleId, shopId: req.user.shopId, isActive: true });

        if (!saleToUpdate) {
            logger.warn(`Update sale: Sale ${saleId} not found in shop ${req.user.shopId}.`);
            return res.status(404).json({ message: 'Sale not found in this shop.' });
        }

        if (value.products) {
            logger.warn(`Update sale: Attempt to modify product list for sale ${saleId}. Disallowed.`);
            return res.status(400).json({ message: 'Modifying sale products is not allowed. Use cancellation/refund process if needed.' });
        }

        const updatedSale = await Sale.findByIdAndUpdate(saleId, value, {
            new: true,
            runValidators: true,
        })
        .populate('products.productId', 'name sku')
        .populate('createdBy', 'name email');

        if (!updatedSale) {
            logger.warn(`Update sale: Sale ${saleId} not found during findByIdAndUpdate.`);
            return res.status(404).json({ message: 'Sale not found.' });
        }

        logger.info(`Sale ${updatedSale.receiptNumber} updated successfully by ${req.user.email}.`);
        res.status(200).json(updatedSale);

    } catch (error) {
        logger.error(`Error updating sale ${req.params.id}: ${error.message}`);
        res.status(500).json({ message: 'Server error updating sale' });
    }
};

const cancelSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const saleId = req.params.id;

        if (!req.user || !req.user.shopId) {
            logger.warn(`Cancel sale: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot cancel sales.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'Only owners and managers can cancel sales.' });
        }

        const saleToCancel = await Sale.findOne({ _id: saleId, shopId: req.user.shopId, isActive: true }).session(session);

        if (!saleToCancel) {
            logger.warn(`Cancel sale: Sale ${saleId} not found or already inactive in shop ${req.user.shopId}.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Sale not found or already cancelled in this shop.' });
        }

        for (const item of saleToCancel.products) {
            const product = await Product.findById(item.productId).session(session);

            if (!product) {
                logger.error(`Cancel sale: Product ${item.productId} not found for sale ${saleId}. Inventory reversal failed.`);
                await session.abortTransaction();
                session.endSession();
                return res.status(500).json({ message: `Failed to reverse inventory for product ${item.productId}. Please contact support.` });
            }

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
                `Sale Cancellation ID: ${saleToCancel._id}`,
                'ADJUSTMENT',
                saleToCancel._id,
                session
            );
        }

        const cancelledSale = await Sale.findByIdAndUpdate(saleId, { isActive: false }, {
            new: true,
            runValidators: true,
        })
        .populate('products.productId', 'name sku')
        .populate('createdBy', 'name email');

        if (!cancelledSale) {
            logger.warn(`Cancel sale: Sale ${saleId} not found during findByIdAndUpdate for soft delete.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Sale not found.' });
        }

        await session.commitTransaction();
        session.endSession();

        logger.warn(`Sale ${cancelledSale.receiptNumber} cancelled successfully by ${req.user.email}. Inventory reversed.`);
        res.status(200).json({
            message: 'Sale cancelled successfully. Inventory has been restored.',
            sale: cancelledSale,
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.error(`Error cancelling sale ${req.params.id}: ${error.message}`);
        res.status(500).json({ message: 'Server error cancelling sale' });
    }
};

module.exports = {
    createSale,
    getAllSales,
    getSaleById,
    updateSale,
    cancelSale,
};