const Notification = require('../models/Notification');
const Product = require('../models/Product');
const logger = require('../config/logger');
const mongoose = require('mongoose');

const createNotification = async (shopId, userId, type, message, relatedProductId = null, session = null) => {
    try {
        const notification = new Notification({
            shopId,
            userId,
            type,
            message,
            relatedProductId,
        });
        await notification.save({ session });
        logger.info(`Notification created: Shop ${shopId}, User ${userId || 'N/A'}, Type ${type}, Msg: "${message}"`);
        return notification;
    } catch (error) {
        logger.error(`Error creating notification: ${error.message}`);
        if (session) throw error;
    }
};

const checkAndNotifyLowStock = async (product, shopId, createdBy, session) => {
    if (product.isActive && product.minStockLevel !== undefined && product.stockQuantity <= product.minStockLevel) {
        const existingNotification = await Notification.findOne({
            shopId: shopId,
            relatedProductId: product._id,
            type: 'LOW_STOCK',
            isRead: false
        }).session(session);

        if (!existingNotification) {
            const message = `Low stock alert for ${product.name} (SKU: ${product.sku}). Current stock: ${product.stockQuantity}, Minimum level: ${product.minStockLevel}.`;
            await createNotification(shopId, null, 'LOW_STOCK', message, product._id, session);
        }
    }
};

const checkAndNotifyExpiration = async (shopId, session) => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringProducts = await Product.find({
        shopId: shopId,
        isActive: true,
        expirationDate: {
            $gte: new Date(),
            $lte: thirtyDaysFromNow
        }
    }).select('_id name sku expirationDate stockQuantity').session(session);

    for (const product of expiringProducts) {
        const existingNotification = await Notification.findOne({
            shopId: shopId,
            relatedProductId: product._id,
            type: 'EXPIRATION',
            isRead: false
        }).session(session);

        if (!existingNotification) {
            const message = `Product "${product.name}" (SKU: ${product.sku}) is expiring on ${product.expirationDate.toLocaleDateString()}. Current stock: ${product.stockQuantity}.`;
            await createNotification(shopId, null, 'EXPIRATION', message, product._id, session);
        }
    }
    logger.info(`Expiration check for shop ${shopId}: Found ${expiringProducts.length} expiring products.`);
};

const getNotifications = async (req, res, next) => {
    try {
        if (!req.user || !req.user.shopId) {
            logger.warn(`Get notifications: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const shopId = req.user.shopId;
        const userId = req.user._id;

        if (req.user.role === 'staff') {
            logger.warn(`User ${req.user.email} (Staff) accessing notifications for shop ${shopId}.`);
            query.$or = [
                { userId: null },
                { userId: userId }
            ];
        } else if (req.user.role !== 'owner' && req.user.role !== 'manager' && req.user.role !== 'superadmin') {
            logger.error(`Authorization error: Unexpected user role ${req.user.role} accessing notifications.`);
            return res.status(403).json({ message: 'Unauthorized access to notifications.' });
        }

        const query = { shopId: shopId };

        if (req.user.role === 'staff') {
             query.$or = [
                 { userId: null },
                 { userId: userId }
             ];
        } else {
            query.$or = [
                { userId: null },
                { userId: userId }
            ];
        }

        if (req.query.type) {
            query.type = req.query.type;
        }

        if (req.query.isRead !== undefined) {
            query.isRead = req.query.isRead === 'true';
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let notificationsQuery = Notification.find(query)
            .populate('relatedProductId', 'name sku')
            .sort({ createdAt: -1 });

        const totalNotifications = await Notification.countDocuments(query);
        const notifications = await notificationsQuery.skip(skip).limit(limit);

        const totalPages = Math.ceil(totalNotifications / limit);

        logger.info(`Retrieved ${notifications.length} notifications for shop ${shopId} (Page: ${page}, Limit: ${limit}). Total found: ${totalNotifications}.`);

        res.status(200).json({
            notifications,
            pagination: {
                currentPage: page,
                limit: limit,
                totalDocs: totalNotifications,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null,
            }
        });

    } catch (error) {
        logger.error(`Error fetching notifications for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

const markNotificationsAsRead = async (req, res, next) => {
    try {
        const { notificationIds } = req.body;

        if (!req.user || !req.user.shopId) {
            logger.warn(`Mark notifications as read: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }
        
        if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of notification IDs to mark as read.' });
        }

        const validIds = notificationIds.every(id => mongoose.Types.ObjectId.isValid(id));
        if (!validIds) {
            return res.status(400).json({ message: 'One or more provided notification IDs are invalid.' });
        }

        const updateResult = await Notification.updateMany(
            { _id: { $in: notificationIds }, shopId: req.user.shopId },
            { $set: { isRead: true } }
        );

        logger.info(`Marked ${updateResult.modifiedCount} notifications as read for shop ${req.user.shopId}.`);

        res.status(200).json({
            message: `Successfully marked ${updateResult.modifiedCount} notifications as read.`,
            matchedCount: updateResult.matchedCount,
            modifiedCount: updateResult.modifiedCount,
        });

    } catch (error) {
        logger.error(`Error marking notifications as read for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error marking notifications as read' });
    }
};

const deleteNotification = async (req, res, next) => {
    try {
        const notificationId = req.params.id;

        if (!req.user || !req.user.shopId) {
            logger.warn(`Delete notification: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot delete notifications.`);
            return res.status(403).json({ message: 'Only owners and managers can delete notifications.' });
        }

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            logger.warn(`Invalid Notification ID format for deletion: ${notificationId}`);
            return res.status(400).json({ message: 'Invalid Notification ID format.' });
        }

        const deletedNotification = await Notification.findOneAndDelete({ _id: notificationId, shopId: req.user.shopId });

        if (!deletedNotification) {
            logger.warn(`Delete notification: Notification ${notificationId} not found or not in shop ${req.user.shopId}.`);
            return res.status(404).json({ message: 'Notification not found in this shop.' });
        }

        logger.info(`Notification ${deletedNotification._id} deleted by ${req.user.email}.`);
        res.status(200).json({ message: 'Notification deleted successfully.' });

    } catch (error) {
        logger.error(`Error deleting notification ${req.params.id}: ${error.message}`);
        res.status(500).json({ message: 'Server error deleting notification' });
    }
};

module.exports = {
    createNotification,
    getNotifications,
    markNotificationsAsRead,
    deleteNotification,
    checkAndNotifyLowStock,
    checkAndNotifyExpiration
};