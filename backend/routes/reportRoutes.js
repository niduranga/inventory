const express = require('express');
const {
    getSalesReports,
    getProfitReports,
    getInventoryReports,
    getTopProducts
} = require('../controllers/reportController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/sales', authorizeRoles('owner', 'manager', 'superadmin'), getSalesReports);
router.get('/profit', authorizeRoles('owner', 'manager', 'superadmin'), getProfitReports);
router.get('/inventory', authorizeRoles('owner', 'manager', 'staff', 'superadmin'), getInventoryReports);
router.get('/top-products', authorizeRoles('owner', 'manager', 'staff', 'superadmin'), getTopProducts);

module.exports = router;