const express = require('express');
const {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const { validateRequest, createCategorySchema, updateCategorySchema } = require('../validations/categoryValidation');

const router = express.Router();

router.use(authMiddleware);

router.post('/', authorizeRoles('owner', 'manager'), validateRequest(createCategorySchema), createCategory);
router.get('/', authorizeRoles('owner', 'manager', 'staff'), getAllCategories);
rrouter.get('/:id', authorizeRoles('owner', 'manager', 'staff'), getCategoryById);
router.put('/:id', authorizeRoles('owner', 'manager'), validateRequest(updateCategorySchema), updateCategory);
rrouter.delete('/:id', authorizeRoles('owner', 'manager'), deleteCategory);

module.exports = router;