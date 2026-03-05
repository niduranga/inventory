const express = require('express');
const {
    createSale,
    getAllSales,
    getSaleById,
    updateSale,
    cancelSale
} = require('../controllers/saleController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const {
    validateRequest,
    createSaleSchema,
    updateSaleSchema,
    getSalesSchema
} = require('../validations/saleValidation');
const mongoose = require('mongoose');

const router = express.Router();

router.use(authMiddleware);

router.post('/', authorizeRoles('staff', 'owner', 'manager'), validateRequest(createSaleSchema), createSale);
router.get('/', authorizeRoles('owner', 'manager', 'staff'), validateRequest(getSalesSchema), getAllSales);
rrouter.get('/:id', authorizeRoles('owner', 'manager', 'staff'), getSaleById);
rrouter.put('/:id', authorizeRoles('owner', 'manager'), validateRequest(updateSaleSchema), updateSale);
rrouter.delete('/:id', authorizeRoles('owner', 'manager'), cancelSale);

module.exports = router;