const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const logger = require('../config/logger');
const mongoose = require('mongoose');
const { inviteUserSchema, updateUserSchema } = require('../validations/userValidations');
const { hashPassword } = require('../utils/passwordUtils');

const getAllUsers = async (req, res, next) => {
    try {
        if (!req.user || !req.user.shopId) {
            logger.warn(`Get all users: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const shopId = req.user.shopId;

        const users = await User.find({
            shopId: shopId,
        }).select('-password');

        logger.info(`Retrieved all users for shop ${req.user.shopId} by user ${req.user.email}. Found ${users.length} users.`);
        res.status(200).json(users);

    } catch (error) {
        logger.error(`Error fetching all users for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching users' });
    }
};

const getUserById = async (req, res, next) => {
    try {
        const userId = req.params.id;

        if (!req.user || !req.user.shopId) {
            logger.warn(`Get user by ID: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const user = await User.findOne({ _id: userId, shopId: req.user.shopId }).select('-password');

        if (!user) {
            logger.warn(`Get user by ID: User ${userId} not found in shop ${req.user.shopId}.`);
            return res.status(404).json({ message: 'User not found in this shop.' });
        }

        logger.info(`Retrieved user ${userId} for shop ${req.user.shopId} by user ${req.user.email}.`);
        res.status(200).json(user);

    } catch (error) {
        logger.error(`Error fetching user ${req.params.id} for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching user' });
    }
};

const inviteUser = async (req, res, next) => {
    try {
        const { error, value } = inviteUserSchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during user invitation: ${error.details[0].message}`);
            return res.status(400).json({ message: error.details[0].message });
        }

        const { name, email, role } = value;

        if (!req.user || !req.user.shopId) {
            logger.warn(`Invite user: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const invitingUserRole = req.user.role;
        const invitedUserRole = role;

        if (invitingUserRole === 'staff') {
            logger.warn(`Authorization error: Staff user ${req.user.email} tried to invite a user.`);
            return res.status(403).json({ message: 'Staff members cannot invite new users.' });
        }
        if (invitingUserRole === 'manager' && (invitedUserRole === 'owner' || invitedUserRole === 'manager')) {
            logger.warn(`Authorization error: Manager ${req.user.email} tried to invite an owner or manager.`);
            return res.status(403).json({ message: 'Managers can only invite staff members.' });
        }
        if (invitingUserRole === 'owner' && invitedUserRole === 'owner') {
            logger.warn(`Authorization error: Owner ${req.user.email} tried to invite another owner.`);
            return res.status(403).json({ message: 'Owners cannot invite other owners directly. Contact SuperAdmin.' });
        }

        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            logger.warn(`Invitation attempt for existing email ${email}.`);
            if (existingUser.shopId && existingUser.shopId.toString() === req.user.shopId.toString() && existingUser.isActive) {
                return res.status(409).json({ message: 'User with this email already exists and is active in this shop.' });
            }
            return res.status(409).json({ message: 'User with this email already exists. Please use a different email or contact an administrator.' });
        }

        const temporaryPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const hashedPassword = await hashPassword(temporaryPassword);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: invitedUserRole,
            shopId: req.user.shopId,
            isActive: true,
        });

        await newUser.save();

        logger.info(`User invited successfully: ${email} (Role: ${role}) to shop ${req.user.shopId} by ${req.user.email}`);

        res.status(201).json({
            message: 'User invited successfully. They can now log in with their email and a temporary password.',
            userId: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            shopId: newUser.shopId,
            temporaryPassword: process.env.NODE_ENV !== 'production' ? temporaryPassword : undefined,
        });

    } catch (error) {
        logger.error(`Error inviting user: ${error.message}`);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }
        res.status(500).json({ message: 'Server error inviting user' });
    }
};

const updateUser = async (req, res, next) => {
    try {
        const userId = req.params.id;

        const { error, value } = updateUserSchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during user update for ID ${userId}: ${error.details[0].message}`);
            return res.status(400).json({ message: error.details[0].message });
        }

        if (!req.user || !req.user.shopId) {
            logger.warn(`Update user: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const userToUpdate = await User.findById(userId);

        if (!userToUpdate) {
            logger.warn(`Update user: User ${userId} not found.`);
            return res.status(404).json({ message: 'User not found.' });
        }
        if (userToUpdate.shopId && userToUpdate.shopId.toString() !== req.user.shopId.toString()) {
            logger.warn(`Update user: User ${userId} does not belong to shop ${req.user.shopId}.`);
            return res.status(403).json({ message: 'User not found in this shop.' });
        }

        const requestingUserRole = req.user.role;
        const targetUserRole = userToUpdate.role;
        const updatingUserEmail = req.user.email;
        const targetUserEmail = userToUpdate.email;

        if (userToUpdate.role === 'superadmin') {
            logger.warn(`Update user: Attempt to update superadmin user ${targetUserEmail} by ${updatingUserEmail}.`);
            return res.status(403).json({ message: 'Superadmin accounts cannot be modified via this endpoint.' });
        }
        
        if (userId === req.user._id.toString() && value.role && value.role !== targetUserRole) {
            if (requestingUserRole === 'owner' || requestingUserRole === 'manager' || requestingUserRole === 'staff') {
                 logger.warn(`Update user: User ${updatingUserEmail} (${requestingUserRole}) cannot change own role to ${value.role}.`);
                 return res.status(403).json({ message: 'You cannot change your own role.' });
            }
        }

        if (requestingUserRole === 'manager' && (targetUserRole === 'owner' || targetUserRole === 'manager')) {
            logger.warn(`Update user: Manager ${updatingUserEmail} cannot update user ${targetUserEmail} (role: ${targetUserRole}).`);
            return res.status(403).json({ message: 'Managers can only update staff users.' });
        }
        if (requestingUserRole === 'staff') {
             logger.warn(`Update user: Staff user ${updatingUserEmail} cannot update any users.`);
             return res.status(403).json({ message: 'Staff users cannot update other users.' });
        }

        if (value.email && value.email !== userToUpdate.email) {
            const existingUserByEmail = await User.findOne({ email: value.email, shopId: req.user.shopId, _id: { $ne: userId } });
            if (existingUserByEmail) {
                logger.warn(`Update user: Email ${value.email} already exists for another user in shop ${req.user.shopId}.`);
                return res.status(409).json({ message: `Email ${value.email} is already in use by another user in this shop.` });
            }
        }
        
        const updatedUser = await User.findByIdAndUpdate(userId, value, {
            new: true,
            runValidators: true,
        }).select('-password');

        if (!updatedUser) {
            logger.warn(`Update user: User ${userId} not found during findByIdAndUpdate.`);
            return res.status(404).json({ message: 'User not found.' });
        }

        logger.info(`User ${targetUserEmail} updated successfully by ${updatingUserEmail}. New details: ${JSON.stringify(value)}`);
        res.status(200).json(updatedUser);

    } catch (error) {
        logger.error(`Error updating user ${req.params.id}: ${error.message}`);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'User update failed: Email already exists.' });
        }
        res.status(500).json({ message: 'Server error updating user' });
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;

        if (!req.user || !req.user.shopId) {
            logger.warn(`Delete user: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot delete users.`);
            return res.status(403).json({ message: 'Only owners and managers can delete users.' });
        }

        const userToDelete = await User.findOne({ _id: userId, shopId: req.user.shopId, isActive: true });

        if (!userToDelete) {
            logger.warn(`Delete user: User ${userId} not found or already inactive in shop ${req.user.shopId}.`);
            return res.status(404).json({ message: 'User not found or already deactivated in this shop.' });
        }

        if (userToDelete.role === 'superadmin') {
            logger.warn(`Delete user: Attempt to delete superadmin user ${userToDelete.email} by ${req.user.email}.`);
            return res.status(403).json({ message: 'Superadmin accounts cannot be deleted.' });
        }
        
        const deletedUser = await User.findByIdAndUpdate(userId, { isActive: false }, {
            new: true,
            runValidators: true,
        }).select('-password');

        if (!deletedUser) {
            logger.warn(`Delete user: User ${userId} not found during findByIdAndUpdate for soft delete.`);
            return res.status(404).json({ message: 'User not found.' });
        }

        logger.warn(`User ${userToDelete.email} soft-deleted successfully by ${req.user.email}.`);
        res.status(200).json({
            message: 'User has been deactivated successfully.',
            user: deletedUser,
        });

    } catch (error) {
        logger.error(`Error soft-deleting user ${req.params.id}: ${error.message}`);
        res.status(500).json({ message: 'Server error deactivating user' });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    inviteUser,
    updateUser,
    deleteUser,
};