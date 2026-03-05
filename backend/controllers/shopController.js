const Shop = require('../models/Shop');
const User = require('../models/User');
const { createShopSchema, updateShopSchema } = require('../validations/shopValidations');
const logger = require('../config/logger');

const createShop = async (req, res, next) => {
    try {
        const { error, value } = createShopSchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during shop creation: ${error.details[0].message}`);
            return res.status(400).json({ message: error.details[0].message });
        }

        if (req.user.role !== 'owner' && req.user.role !== 'superadmin') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) attempting to create shop.`);
            return res.status(403).json({ message: 'Only owners or superadmins can create shops.' });
        }

        if (req.user.role === 'owner' && req.user.shopId) {
            const existingShop = await Shop.findById(req.user.shopId);
            if (existingShop) {
                logger.warn(`Shop creation attempt by owner ${req.user.email} who already owns shop ${req.user.shopId}.`);
                return res.status(400).json({ message: 'You already own a shop.' });
            }
        }

        let ownerId = req.user._id;
        if (req.user.role === 'superadmin' && req.body.ownerId) {
            const potentialOwner = await User.findById(req.body.ownerId).select('role shopId');
            if (!potentialOwner) {
                logger.warn(`Shop creation by superadmin failed: Specified owner ID ${req.body.ownerId} not found.`);
                return res.status(404).json({ message: 'Specified owner user not found.' });
            }
            if (potentialOwner.role !== 'owner') {
                logger.warn(`Shop creation by superadmin failed: Specified user ${req.body.ownerId} is not an owner (role: ${potentialOwner.role}).`);
                return res.status(400).json({ message: 'The specified user must have the "owner" role.' });
            }
            if (potentialOwner.shopId) {
                logger.warn(`Shop creation by superadmin failed: Specified user ${req.body.ownerId} already owns a shop.`);
                return res.status(400).json({ message: 'The specified user already owns a shop.' });
            }
            ownerId = req.body.ownerId;
        } else if (req.user.role === 'superadmin' && !req.body.ownerId) {
            logger.warn(`Shop creation by superadmin missing ownerId. Owner ID is required when creating a shop as a superadmin.`);
            return res.status(400).json({ message: 'Owner ID is required when creating a shop as a superadmin.' });
        }

        const newShop = new Shop({
            ...value,
            ownerId: ownerId,
        });

        const savedShop = await newShop.save();

        const ownerUser = await User.findById(ownerId);
        if (!ownerUser) {
            logger.error(`Shop created (${savedShop._id}), but owner user ${ownerId} not found. Consistency error.`);
        } else {
            ownerUser.shopId = savedShop._id;
            ownerUser.role = 'owner';
            await ownerUser.save();
            logger.info(`Owner ${ownerId} assigned to shop ${savedShop._id}. User role set to 'owner'.`);
        }

        logger.info(`Shop created successfully: ${savedShop.shopName} by owner ${ownerId}`);

        res.status(201).json({
            message: 'Shop created successfully',
            shop: savedShop,
        });

    } catch (error) {
        logger.error(`Error creating shop: ${error.message}`);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Shop creation failed: Owner already has a shop.' });
        }
        res.status(500).json({ message: 'Server error creating shop' });
    }
};

const getShopDetails = async (req, res, next) => {
    try {
        const shopId = req.shopId;

        if (!shopId) {
            logger.warn(`Shop details request: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(400).json({ message: 'User is not associated with any shop.' });
        }

        const shop = await Shop.findById(shopId).populate('ownerId', 'name email role');

        if (!shop) {
            logger.error(`Shop details request: Shop not found for ID ${shopId}. User ${req.user.email} is in an inconsistent state.`);
            if (req.user.shopId === shopId) {
                req.user.shopId = null;
                await req.user.save();
            }
            return res.status(404).json({ message: 'Shop not found. Your user record has been updated.' });
        }

        logger.info(`Shop details retrieved for shop: ${shop.shopName} by user ${req.user.email}`);
        res.status(200).json(shop);

    } catch (error) {
        logger.error(`Error fetching shop details: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching shop details' });
    }
};

const updateShop = async (req, res, next) => {
    try {
        const { error, value } = updateShopSchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during shop update: ${error.details[0].message}`);
            return res.status(400).json({ message: error.details[0].message });
        }

        if (!req.user || !req.user.shopId) {
            logger.warn(`Update shop: User ${req.user ? req.user.email : 'unknown'} attempting to update shop without being associated.`);
            return res.status(403).json({ message: 'User not associated with a shop.' });
        }

        if (req.user.role !== 'owner' && req.user.role !== 'superadmin') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot update shop details.`);
            return res.status(403).json({ message: 'Only owners or superadmins can update shop details.' });
        }

        const shopIdToUpdate = req.user.shopId;

        if (value.shopName && req.user.shopId) {
            const existingShopWithSameName = await Shop.findOne({ shopName: value.shopName, _id: { $ne: req.user.shopId } });
            if (existingShopWithSameName) {
                logger.warn(`Shop update failed: Shop name '${value.shopName}' already exists.`);
                return res.status(400).json({ message: `Shop name '${value.shopName}' is already taken.` });
            }
        }

        const updatedShop = await Shop.findByIdAndUpdate(shopIdToUpdate, value, {
            new: true,
            runValidators: true,
        }).populate('ownerId', 'name email role');

        if (!updatedShop) {
            logger.warn(`Update shop: Shop not found for ID ${shopIdToUpdate}. User ${req.user.email} is in an inconsistent state.`);
            if (req.user.shopId === shopIdToUpdate) {
                req.user.shopId = null;
                await req.user.save();
            }
            return res.status(404).json({ message: 'Shop not found. Your user record has been updated.' });
        }

        logger.info(`Shop updated successfully: ${updatedShop.shopName} by user ${req.user.email}`);
        res.status(200).json(updatedShop);

    } catch (error) {
        logger.error(`Error updating shop: ${error.message}`);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Shop update failed: Shop name already exists.' });
        }
        res.status(500).json({ message: 'Server error updating shop' });
    }
};

module.exports = {
    createShop,
    getShopDetails,
    updateShop,
};