const express = require('express');
const { createShop, getShopDetails, updateShop } = require('../controllers/shopController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');
const { createShopSchema, updateShopSchema } = require('../validations/shopValidations');

const router = express.Router();

router.use(authMiddleware);

router.post('/create', authorizeRoles('owner', 'superadmin'), validateRequest(createShopSchema), createShop);
router.get('/me', getShopDetails);
router.put('/me', authorizeRoles('owner', 'superadmin'), validateRequest(updateShopSchema), updateShop);

module.exports = router;