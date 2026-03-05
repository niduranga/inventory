const express = require('express');
const {
    createPurchase,
    getAllPurchases,
    getPurchaseById,
    updatePurchase,
    deletePurchase
} = require('../controllers/purchaseController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const { validateRequest, createPurchaseSchema, updatePurchaseSchema, getPurchasesSchema } = require('../validations/purchaseValidation');

const router = express.Router();

router.use(authMiddleware);

router.post('/', authorizeRoles('owner', 'manager'), validateRequest(createPurchaseSchema), createPurchase);
router.get('/', authorizeRoles('owner', 'manager', 'staff'), validateRequest(getPurchasesSchema), getAllPurchases);
rrouter.get('/:id', authorizeRoles('owner', 'manager', 'staff'), getPurchaseById);
router.put('/:id', authorizeRoles('owner', 'manager'), validateRequest(updatePurchaseSchema), updatePurchase);
rrouter.delete('/:id', authorizeRoles('owner', 'manager'), deletePurchase);

module.exports = router;