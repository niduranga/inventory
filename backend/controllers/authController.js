const User = require('../models/User');
const Shop = require('../models/Shop');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { signToken } = require('../utils/jwt');
const logger = require('../config/logger');
const { registerSchema, loginSchema } = require('../validations/authValidations');

const registerUser = async (req, res, next) => {
    try {
        // 1. Validate Input
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during user registration: ${error.details[0].message}`);
            return res.status(400).json({ message: error.details[0].message });
        }

        const { name, email, password, role } = value;

        // 2. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            logger.warn(`Registration attempt for existing email: ${email}`);
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // 3. Superadmin registration check
        if (role === 'superadmin') {
            logger.warn(`Attempt to register as superadmin via general registration: ${email}`);
            return res.status(403).json({ message: 'Superadmin registration is not permitted via this endpoint.' });
        }

        // 4. HASH THE PASSWORD (මෙන්න මේකයි කලින් අමතක වෙලා තිබුණේ)
        const hashedPassword = await hashPassword(password);

        // 5. Create New User
        const newUser = new User({
            name,
            email,
            password: hashedPassword, // හෑෂ් කරපු පාස්වර්ඩ් එක මෙතනට දාන්න
            role: role || 'user',
            shopId: null,
            isActive: true,
        });

        // 6. Save to Database
        await newUser.save();

        logger.info(`User registered successfully: ${email}`);

        res.status(201).json({
            message: 'User registered successfully. Please log in.',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            },
        });

    } catch (error) {
        // මොකක්ද වෙච්ච error එක කියලා console එකේ බලාගන්න මේක උදව් වෙනවා
        logger.error(`Error during user registration: ${error.stack}`);
        
        if (error.code === 11000) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        
        res.status(500).json({ 
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
};

const loginUser = async (req, res, next) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during user login: ${error.details[0].message}`);
            return res.status(400).json({ message: error.details[0].message });
        }

        const { email, password } = value;

        // User හොයද්දී password එකත් එක්කම ගන්න (select: false දාලා ඇති මොඩල් එකේ)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            logger.warn(`Login attempt failed: User not found for email ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 7. Compare Hashed Password
        const isMatch = await comparePassword(password, user.password);

        if (!isMatch) {
            logger.warn(`Login attempt failed: Incorrect password for email ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            logger.warn(`Login attempt failed: User ${email} is inactive`);
            return res.status(403).json({ message: 'Your account is inactive. Please contact support.' });
        }
        
        // Superadmin නෙවෙයි නම් අනිවාර්යයෙන් Shop එකක් තියෙන්න ඕනේ
        if (user.role !== 'superadmin' && !user.shopId) {
            logger.warn(`Login attempt failed: User ${email} is not associated with a shop.`);
            return res.status(403).json({ message: 'User is not assigned to a shop. Please contact your administrator.' });
        }

        const token = signToken({ userId: user._id, role: user.role, shopId: user.shopId });

        logger.info(`User logged in successfully: ${email}`);

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                shopId: user.shopId,
                isActive: user.isActive,
            },
        });

    } catch (error) {
        logger.error(`Error during user login: ${error.stack}`);
        res.status(500).json({ message: 'Server error during login' });
    }
};

module.exports = {
    registerUser,
    loginUser,
};