const express = require('express');
const {
    stockIn,
    stockOut,
    adjustStock,
    getStockHistory,
    getProductStockHistory
} = require('../controllers/inventoryController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const {
    validateRequest,
    stockInSchema,
    stockOutSchema,
    adjustStockSchema,
    getStockHistorySchema
} = require('../validations/inventoryValidation');
const mongoose = require('mongoose');

const router = express.Router();

router.use(authMiddleware);

router.post('/stock-in', authorizeRoles('owner', 'manager'), validateRequest(stockInSchema), stockIn);
router.post('/stock-out', authorizeRoles('owner', 'manager'), validateRequest(stockOutSchema), stockOut);
router.post('/adjust', authorizeRoles('owner', 'manager'), validateRequest(adjustStockSchema), adjustStock);
router.get('/history', authorizeRoles('owner', 'manager', 'staff'), validateRequest(getStockHistorySchema), getStockHistory);
rrouter.get('/product/:productId', authorizeRoles('owner', 'manager', 'staff'), (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
        return res.status(400).json({ message: 'Invalid Product ID format.' });
    }
    validateRequest(getStockHistorySchema)(req, res, next);
}, getProductStockHistory);

module.exports = router;