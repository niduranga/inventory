const express = require('express');
const {
    createSupplier,
    getAllSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
} = require('../controllers/supplierController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const { validateRequest, createSupplierSchema, updateSupplierSchema } = require('../validations/supplierValidation');

const router = express.Router();

router.use(authMiddleware);

router.post('/', authorizeRoles('owner', 'manager'), validateRequest(createSupplierSchema), createSupplier);
router.get('/', authorizeRoles('owner', 'manager', 'staff'), getAllSuppliers);
rrouter.get('/:id', authorizeRoles('owner', 'manager', 'staff'), getSupplierById);
router.put('/:id', authorizeRoles('owner', 'manager'), validateRequest(updateSupplierSchema), updateSupplier);
rrouter.delete('/:id', authorizeRoles('owner', 'manager'), deleteSupplier);

module.exports = router;