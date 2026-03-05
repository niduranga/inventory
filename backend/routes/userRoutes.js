const express = require('express');
const { getAllUsers, getUserById, inviteUser, updateUser, deleteUser } = require('../controllers/userController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');
const { inviteUserSchema, updateUserSchema } = require('../validations/userValidations');

const router = express.Router();

router.use(authMiddleware);

router.get('/', authorizeRoles('owner', 'manager'), getAllUsers);
router.get('/:id', authorizeRoles('owner', 'manager'), getUserById);
router.post('/invite', authorizeRoles('owner', 'manager', 'superadmin'), validateRequest(inviteUserSchema), inviteUser);
router.put('/:id', authorizeRoles('owner', 'manager', 'superadmin'), validateRequest(updateUserSchema), updateUser);
router.delete('/:id', authorizeRoles('owner', 'manager', 'superadmin'), deleteUser);

module.exports = router;