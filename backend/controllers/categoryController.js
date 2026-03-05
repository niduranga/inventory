const Category = require('../models/Category');
const User = require('../models/User');
const Product = require('../models/Product');
const logger = require('../config/logger');
const { createCategorySchema, updateCategorySchema } = require('../validations/categoryValidation');

const isCategoryInUse = async (shopId, categoryId) => {
    try {
        const productCount = await Product.countDocuments({ categoryId: categoryId, shopId: shopId, isActive: true });
        return productCount > 0;
    } catch (error) {
        logger.error(`Error checking product count for category ${categoryId} in shop ${shopId}: ${error.message}`);
        return false;
    }
};

const createCategory = async (req, res, next) => {
    try {
        const { error, value } = createCategorySchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during category creation: ${error.details[0].message}`);
            return res.status(400).json({ message: error.details[0].message });
        }

        if (!req.user || !req.user.shopId) {
            logger.warn(`Create category: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot create categories.`);
            return res.status(403).json({ message: 'Only owners and managers can create categories.' });
        }

        const { name, description } = value;
        const shopId = req.user.shopId;
        const createdBy = req.user._id;

        const existingCategory = await Category.findOne({ name: name, shopId: shopId });
        if (existingCategory) {
            logger.warn(`Category creation failed: Category name '${name}' already exists in shop ${shopId}.`);
            return res.status(409).json({ message: `Category with name '${name}' already exists in this shop.` });
        }

        const newCategory = new Category({
            name,
            description,
            shopId,
            createdBy,
            isActive: true,
        });

        await newCategory.save();

        logger.info(`Category created successfully: "${newCategory.name}" in shop ${shopId} by user ${createdBy}`);

        res.status(201).json({
            message: 'Category created successfully',
            category: newCategory,
        });

    } catch (error) {
        logger.error(`Error creating category: ${error.message}`);
        if (error.code === 11000 && error.message.includes('name_1_shopId_1')) {
            return res.status(409).json({ message: `Category with name '${req.body.name}' already exists in this shop.` });
        }
        res.status(500).json({ message: 'Server error creating category' });
    }
};

const getAllCategories = async (req, res, next) => {
    try {
        if (!req.user || !req.user.shopId) {
            logger.warn(`Get all categories: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const shopId = req.user.shopId;

        const query = { shopId: shopId, isActive: true };

        if (req.query.search) {
            const searchTerm = req.query.search;
            query.name = { $regex: searchTerm, $options: 'i' };
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let categoriesQuery = Category.find(query)
            .populate('createdBy', 'name email')
            .sort({ name: 1 });

        const totalCategories = await Category.countDocuments(query);
        const categories = await categoriesQuery.skip(skip).limit(limit);

        const totalPages = Math.ceil(totalCategories / limit);

        logger.info(`Retrieved ${categories.length} categories for shop ${shopId} (Page: ${page}, Limit: ${limit}). Total found: ${totalCategories}.`);

        res.status(200).json({
            categories,
            pagination: {
                currentPage: page,
                limit: limit,
                totalDocs: totalCategories,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null,
            }
        });

    } catch (error) {
        logger.error(`Error fetching all categories for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching categories' });
    }
};

const getCategoryById = async (req, res, next) => {
    try {
        const categoryId = req.params.id;

        if (!req.user || !req.user.shopId) {
            logger.warn(`Get category by ID: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const category = await Category.findOne({ _id: categoryId, shopId: req.user.shopId, isActive: true })
            .populate('createdBy', 'name email');

        if (!category) {
            logger.warn(`Get category by ID: Category ${categoryId} not found in shop ${req.user.shopId}.`);
            return res.status(404).json({ message: 'Category not found in this shop.' });
        }

        logger.info(`Retrieved category ${categoryId} for shop ${req.user.shopId} by user ${req.user.email}.`);
        res.status(200).json(category);

    } catch (error) {
        logger.error(`Error fetching category ${req.params.id} for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching category' });
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const categoryId = req.params.id;

        const { error, value } = updateCategorySchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during category update for ID ${categoryId}: ${error.details[0].message}`);
            return res.status(400).json({ message: error.details[0].message });
        }

        if (!req.user || !req.user.shopId) {
            logger.warn(`Update category: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot update categories.`);
            return res.status(403).json({ message: 'Only owners and managers can update categories.' });
        }

        const categoryToUpdate = await Category.findOne({ _id: categoryId, shopId: req.user.shopId, isActive: true });

        if (!categoryToUpdate) {
            logger.warn(`Update category: Category ${categoryId} not found in shop ${req.user.shopId}.`);
            return res.status(404).json({ message: 'Category not found in this shop.' });
        }

        if (value.name && value.name !== categoryToUpdate.name) {
            const existingCategory = await Category.findOne({ name: value.name, shopId: req.user.shopId, _id: { $ne: categoryId } });
            if (existingCategory) {
                logger.warn(`Category update failed: Category name '${value.name}' already exists in shop ${req.user.shopId}.`);
                return res.status(409).json({ message: `Category name '${value.name}' is already in use in this shop.` });
            }
        }

        const updatedCategory = await Category.findByIdAndUpdate(categoryId, value, {
            new: true,
            runValidators: true,
        })
        .populate('createdBy', 'name email');

        if (!updatedCategory) {
            logger.warn(`Update category: Category ${categoryId} not found during findByIdAndUpdate.`);
            return res.status(404).json({ message: 'Category not found.' });
        }

        logger.info(`Category "${updatedCategory.name}" updated successfully by ${req.user.email}.`);
        res.status(200).json(updatedCategory);

    } catch (error) {
        logger.error(`Error updating category ${req.params.id}: ${error.message}`);
        if (error.code === 11000 && error.message.includes('name_1_shopId_1')) {
            return res.status(409).json({ message: `Category name '${req.body.name}' already exists in this shop.` });
        }
        res.status(500).json({ message: 'Server error updating category' });
    }
};

const deleteCategory = async (req, res, next) => {
    try {
        const categoryId = req.params.id;

        if (!req.user || !req.user.shopId) {
            logger.warn(`Delete category: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot delete categories.`);
            return res.status(403).json({ message: 'Only owners and managers can delete categories.' });
        }

        const categoryToDelete = await Category.findOne({ _id: categoryId, shopId: req.user.shopId, isActive: true });

        if (!categoryToDelete) {
            logger.warn(`Delete category: Category ${categoryId} not found or already inactive in shop ${req.user.shopId}.`);
            return res.status(404).json({ message: 'Category not found or already deactivated in this shop.' });
        }
        
        const isInUse = await isCategoryInUse(req.user.shopId, categoryId);
        if (isInUse) {
            logger.warn(`Delete category: Category ${categoryId} is in use by products and cannot be deleted.`);
            return res.status(400).json({ message: 'This category is currently used by products and cannot be deleted. Please reassign products first.' });
        }

        const deletedCategory = await Category.findByIdAndUpdate(categoryId, { isActive: false }, {
            new: true,
            runValidators: true,
        })
        .populate('createdBy', 'name email');

        if (!deletedCategory) {
            logger.warn(`Delete category: Category ${categoryId} not found during findByIdAndUpdate for soft delete.`);
            return res.status(404).json({ message: 'Category not found.' });
        }

        logger.warn(`Category "${deletedCategory.name}" soft-deleted by ${req.user.email}.`);
        res.status(200).json({
            message: 'Category has been deactivated successfully.',
            category: deletedCategory,
        });

    } catch (error) {
        logger.error(`Error soft-deleting category ${req.params.id}: ${error.message}`);
        res.status(500).json({ message: 'Server error deactivating category' });
    }
};

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};