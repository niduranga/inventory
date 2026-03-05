const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const { validateRequest } = require('../middleware/validateRequest');
const { registerSchema, loginSchema } = require('../validations/authValidations');

const router = express.Router();

router.post('/register', validateRequest(registerSchema), registerUser);
router.post('/login', validateRequest(loginSchema), loginUser);

module.exports = router;