const mongoose = require('mongoose');
const logger = require('../config/logger');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Purchase = require('../models/Purchase');
const StockMovement = require('../models/StockMovement');
const User = require('../models/User');

const checkReferenceOwnership = async (shopId, refType, refId, session) => {
    let Model;
    switch (refType) {
        case 'category': Model = require('../models/Category'); break;
        case 'supplier': Model = require('../models/Supplier'); break;
        case 'product': Model = Product; break;
        case 'user': Model = User; break;
        case 'sale': Model = Sale; break;
        case 'purchase': Model = Purchase; break;
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

const getSalesReports = async (req, res, next) => {
    try {
        if (!req.user || !req.user.shopId) {
            logger.warn(`Get sales report: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const shopId = req.user.shopId;

        if (req.user.role === 'staff') {
            logger.warn(`User ${req.user.email} (Staff) accessing sales reports for shop ${shopId}.`);
        } else if (req.user.role !== 'owner' && req.user.role !== 'manager' && req.user.role !== 'superadmin') {
            logger.error(`Authorization error: Unexpected user role ${req.user.role} accessing sales reports.`);
            return res.status(403).json({ message: 'Unauthorized access to sales reports.' });
        }

        const pipeline = [];

        pipeline.push({
            $match: {
                shopId: new mongoose.Types.ObjectId(shopId),
                isActive: true,
            }
        });

        if (req.query.startDate || req.query.endDate) {
            const dateFilter = {};
            if (req.query.startDate) {
                dateFilter.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                const endDate = new Date(req.query.endDate);
                endDate.setHours(23, 59, 59, 999);
                dateFilter.$lte = endDate;
            }
            if (Object.keys(dateFilter).length > 0) {
                pipeline.push({ $match: { createdAt: dateFilter } });
            }
        }

        if (req.query.paymentMethod) {
            pipeline.push({ $match: { paymentMethod: req.query.paymentMethod } });
        }

        if (req.query.paymentStatus) {
            pipeline.push({ $match: { paymentStatus: req.query.paymentStatus } });
        }

        let groupStage = {};
        const groupBy = req.query.groupBy || 'day';

        switch (groupBy) {
            case 'week':
                groupStage = {
                    _id: { $dateToString: { format: "%Y-%V", date: "$createdAt" } }
                };
                break;
            case 'month':
                groupStage = {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
                };
                break;
            case 'day':
            default:
                groupStage = {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                };
                break;
        }

        pipeline.push({
            $facet: {
                aggregatedSales: [
                    {
                        $group: {
                            _id: groupStage._id,
                            totalSales: { $sum: "$totalAmount" },
                            numberOfSales: { $sum: 1 }
                        }
                    },
                    {
                        $sort: { _id: 1 }
                    }
                ],
                totalSalesOverall: [
                    {
                        $group: {
                            _id: null,
                            totalSalesAmountOverall: { $sum: "$totalAmount" },
                            totalNumberOfSalesOverall: { $sum: 1 }
                        }
                    }
                ]
            }
        });
        
        const aggregatedResults = await Sale.aggregate(pipeline);
        const salesData = aggregatedResults[0];

        const formattedSales = salesData.aggregatedSales.map(item => ({
            period: item._id,
            totalSales: item.totalSales,
            numberOfSales: item.numberOfSales
        }));

        const overallSummary = salesData.totalSalesOverall.length > 0 ? salesData.totalSalesOverall[0] : { totalSalesAmountOverall: 0, totalNumberOfSalesOverall: 0 };

        logger.info(`Sales report generated for shop ${shopId}. Grouped by: ${groupBy}. Found ${formattedSales.length} periods.`);

        res.status(200).json({
            reportTitle: `Sales Report (${groupBy})`,
            summary: {
                totalSalesAmount: overallSummary.totalSalesAmountOverall,
                totalNumberOfSales: overallSummary.totalNumberOfSalesOverall
            },
            data: formattedSales,
        });

    } catch (error) {
        logger.error(`Error generating sales report for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error generating sales report' });
    }
};

const getProfitReports = async (req, res, next) => {
    try {
        if (!req.user || !req.user.shopId) {
            logger.warn(`Get profit report: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const shopId = req.user.shopId;

        if (req.user.role !== 'owner' && req.user.role !== 'manager' && req.user.role !== 'superadmin') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot access profit reports.`);
            return res.status(403).json({ message: 'Only owners and managers can access profit reports.' });
        }

        const pipeline = [];

        pipeline.push({
            $match: {
                shopId: new mongoose.Types.ObjectId(shopId),
                isActive: true,
            }
        });

        if (req.query.startDate || req.query.endDate) {
            const dateFilter = {};
            if (req.query.startDate) {
                dateFilter.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                const endDate = new Date(req.query.endDate);
                endDate.setHours(23, 59, 59, 999);
                dateFilter.$lte = endDate;
            }
            if (Object.keys(dateFilter).length > 0) {
                pipeline.push({ $match: { createdAt: dateFilter } });
            }
        }

        if (req.query.paymentMethod) {
            pipeline.push({ $match: { paymentMethod: req.query.paymentMethod } });
        }
        
        if (req.query.paymentStatus) {
            pipeline.push({ $match: { paymentStatus: req.query.paymentStatus } });
        }

        pipeline.push({
            $unwind: "$products"
        });

        pipeline.push({
            $lookup: {
                from: 'products',
                localField: 'products.productId',
                foreignField: '_id',
                as: 'productInfo'
            }
        });
        pipeline.push({
            $unwind: {
                path: "$productInfo",
                preserveNullAndEmptyArrays: true
            }
        });

        pipeline.push({
            $addFields: {
                itemRevenue: "$products.totalPrice",
                itemCOGS: {
                    $multiply: [
                        "$products.quantity",
                        { $ifNull: ["$productInfo.purchasePrice", 0] }
                    ]
                }
            }
        });

        let groupStage = {};
        const groupBy = req.query.groupBy || 'day';

        switch (groupBy) {
            case 'week':
                groupStage = {
                    _id: { $dateToString: { format: "%Y-%V", date: "$createdAt" } }
                };
                break;
            case 'month':
                groupStage = {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
                };
                break;
            case 'day':
            default:
                groupStage = {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                };
                break;
        }

        pipeline.push({
            $group: {
                _id: groupStage._id,
                totalRevenue: { $sum: "$itemRevenue" },
                totalCOGS: { $sum: "$itemCOGS" },
                numberOfSales: { $addToSet: "$_id" }
            }
        });
        
        pipeline.push({
            $addFields: {
                profit: { $subtract: ["$totalRevenue", "$totalCOGS"] }
            }
        });

        pipeline.push({
            $sort: { _id: 1 }
        });
        
        const profitData = await Sale.aggregate(pipeline);

        const formattedProfit = profitData.map(item => ({
            period: item._id,
            totalRevenue: item.totalRevenue,
            totalCOGS: item.totalCOGS,
            profit: item.profit,
            numberOfSales: item.numberOfSales.length
        }));
        
        let overallTotalRevenue = 0;
        let overallTotalCOGS = 0;
        let overallProfit = 0;
        let overallNumberOfSales = 0;
        
        formattedProfit.forEach(period => {
            overallTotalRevenue += period.totalRevenue;
            overallTotalCOGS += period.totalCOGS;
            overallProfit += period.profit;
            overallNumberOfSales += period.numberOfSales;
        });

        logger.info(`Profit report generated for shop ${shopId}. Grouped by: ${groupBy}. Found ${formattedProfit.length} periods.`);

        res.status(200).json({
            reportTitle: `Profit Report (${groupBy})`,
            summary: {
                totalRevenue: overallTotalRevenue,
                totalCOGS: overallTotalCOGS,
                totalProfit: overallProfit,
                totalNumberOfSales: overallNumberOfSales
            },
            data: formattedProfit,
        });

    } catch (error) {
        logger.error(`Error generating profit report for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error generating profit report' });
    }
};

const getInventoryReports = async (req, res, next) => {
    try {
        if (!req.user || !req.user.shopId) {
            logger.warn(`Get inventory report: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const shopId = req.user.shopId;

        if (req.user.role === 'staff') {
            logger.warn(`User ${req.user.email} (Staff) accessing inventory reports for shop ${shopId}.`);
        } else if (req.user.role !== 'owner' && req.user.role !== 'manager' && req.user.role !== 'superadmin') {
            logger.error(`Authorization error: Unexpected user role ${req.user.role} accessing inventory reports.`);
            return res.status(403).json({ message: 'Unauthorized access to inventory reports.' });
        }

        const baseProductQuery = { shopId: shopId, isActive: true };

        if (req.query.categoryId) {
            baseProductQuery.categoryId = req.query.categoryId;
        }

        if (req.query.supplierId) {
            baseProductQuery.supplierId = req.query.supplierId;
        }

        const inventoryReports = {};

        let currentStockQuery = Product.find(baseProductQuery).select('name sku stockQuantity minStockLevel expirationDate');
        if (req.query.sortBy) {
            const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
            currentStockQuery = currentStockQuery.sort({ [req.query.sortBy]: sortOrder });
        } else {
            currentStockQuery = currentStockQuery.sort({ name: 1 });
        }
        inventoryReports.currentStock = await currentStockQuery;

        const lowStockProducts = await Product.find({
            ...baseProductQuery,
            $expr: { $lt: ["$stockQuantity", "$minStockLevel"] }
        }).select('name sku stockQuantity minStockLevel');
        inventoryReports.lowStockItems = lowStockProducts;

        const expiringSoonDate = new Date();
        expiringSoonDate.setDate(expiringSoonDate.getDate() + 30);

        const expiringProducts = await Product.find({
            ...baseProductQuery,
            expirationDate: {
                $gte: new Date(),
                $lte: expiringSoonDate
            }
        }).select('name sku expirationDate stockQuantity');
        inventoryReports.expiringProducts = expiringProducts;
        
        logger.info(`Inventory reports generated for shop ${shopId}.`);

        res.status(200).json({
            reportTitle: 'Inventory Report',
            filters: {
                categoryId: req.query.categoryId,
                supplierId: req.query.supplierId,
                expiringDaysAhead: 30
            },
            data: inventoryReports
        });

    } catch (error) {
        logger.error(`Error generating inventory report for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error generating inventory report' });
    }
};

const getTopProducts = async (req, res, next) => {
    try {
        if (!req.user || !req.user.shopId) {
            logger.warn(`Get top products report: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const shopId = req.user.shopId;

        if (req.user.role === 'staff') {
            logger.warn(`User ${req.user.email} (Staff) accessing top products report for shop ${shopId}.`);
        } else if (req.user.role !== 'owner' && req.user.role !== 'manager' && req.user.role !== 'superadmin') {
            logger.error(`Authorization error: Unexpected user role ${req.user.role} accessing top products report.`);
            return res.status(403).json({ message: 'Unauthorized access to top products report.' });
        }

        const pipeline = [];

        pipeline.push({
            $match: {
                shopId: new mongoose.Types.ObjectId(shopId),
                isActive: true,
            }
        });

        if (req.query.startDate || req.query.endDate) {
            const dateFilter = {};
            if (req.query.startDate) {
                dateFilter.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                const endDate = new Date(req.query.endDate);
                endDate.setHours(23, 59, 59, 999);
                dateFilter.$lte = endDate;
            }
            if (Object.keys(dateFilter).length > 0) {
                pipeline.push({ $match: { createdAt: dateFilter } });
            }
        }
        
        if (req.query.paymentMethod) {
            pipeline.push({ $match: { paymentMethod: req.query.paymentMethod } });
        }

        pipeline.push({ $unwind: "$products" });

        pipeline.push({
            $lookup: {
                from: 'products',
                localField: 'products.productId',
                foreignField: '_id',
                as: 'productInfo'
            }
        });
        pipeline.push({
            $unwind: {
                path: "$productInfo",
                preserveNullAndEmptyArrays: true
            }
        });

        pipeline.push({
             $match: {
                 'productInfo': { $exists: true, $ne: null, 'shopId': new mongoose.Types.ObjectId(shopId), 'isActive': true }
             }
        });

        pipeline.push({
            $group: {
                _id: {
                    productId: '$products.productId',
                    name: '$productInfo.name',
                    sku: '$productInfo.sku'
                },
                totalQuantitySold: { $sum: '$products.quantity' },
                totalRevenue: { $sum: '$products.totalPrice' }
            }
        });

        const sortBy = req.query.sortBy || 'totalQuantitySold';
        const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
        pipeline.push({ $sort: { [sortBy]: sortOrder } });

        const limit = parseInt(req.query.limit) || 10;
        pipeline.push({ $limit: limit });

        const topProducts = await Sale.aggregate(pipeline);

        logger.info(`Top products report generated for shop ${shopId}. Sorted by: ${sortBy} ${sortOrder === -1 ? 'DESC' : 'ASC'}. Limit: ${limit}.`);

        res.status(200).json({
            reportTitle: `Top Selling Products (${sortBy})`,
            sortBy: sortBy,
            sortOrder: sortOrder === -1 ? 'DESC' : 'ASC',
            limit: limit,
            data: topProducts
        });

    } catch (error) {
        logger.error(`Error generating top products report for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error generating top products report' });
    }
};

module.exports = {
    getSalesReports,
    getProfitReports,
    getInventoryReports,
    getTopProducts,
};