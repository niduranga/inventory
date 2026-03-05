const express = require('express');
const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const { validateRequest, createProductSchema, updateProductSchema } = require('../validations/productValidation');

const router = express.Router();

router.use(authMiddleware);

router.post('/', authorizeRoles('owner', 'manager'), validateRequest(createProductSchema), createProduct);
router.get('/', authorizeRoles('owner', 'manager', 'staff'), getAllProducts);
router.get('/:id', authorizeRoles('owner', 'manager', 'staff'), getProductById);
router.put('/:id', authorizeRoles('owner', 'manager'), validateRequest(updateProductSchema), updateProduct);
rrouter.delete('/:id', authorizeRoles('owner', 'manager'), deleteProduct);

module.exports = router;