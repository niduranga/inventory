const Product = require('../models/Product');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const logger = require('../config/logger');
const { createProductSchema, updateProductSchema } = require('../validations/productValidation');

const checkReferenceOwnership = async (shopId, refType, refId) => {
    let Model;
    switch (refType) {
        case 'category': Model = Category; break;
        case 'supplier': Model = Supplier; break;
        default: return false;
    }
    try {
        const ref = await Model.findOne({ _id: refId, shopId: shopId, isActive: true });
        return !!ref;
    } catch (error) {
        logger.error(`Error checking ownership for ${refType} ID ${refId} in shop ${shopId}: ${error.message}`);
        return false;
    }
};

const createProduct = async (req, res, next) => {
    try {
        const { error, value } = createProductSchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during product creation: ${error.details[0].message}`);
            return res.status(400).json({ message: error.details[0].message });
        }

        if (!req.user || !req.user.shopId) {
            logger.warn(`Create product: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot create products.`);
            return res.status(403).json({ message: 'Only owners and managers can create products.' });
        }

        const { name, sku, barcode, categoryId, supplierId, purchasePrice, sellingPrice, stockQuantity, minStockLevel, description, productImage, expirationDate } = value;
        const shopId = req.user.shopId;
        const createdBy = req.user._id;

        const categoryExists = await checkReferenceOwnership(shopId, 'category', categoryId);
        if (!categoryExists) {
            logger.warn(`Product creation failed: Category ID ${categoryId} not found or not in shop ${shopId}.`);
            return res.status(404).json({ message: 'Invalid Category ID. Category not found or does not belong to this shop.' });
        }

        const supplierExists = await checkReferenceOwnership(shopId, 'supplier', supplierId);
        if (!supplierExists) {
            logger.warn(`Product creation failed: Supplier ID ${supplierId} not found or not in shop ${shopId}.`);
            return res.status(404).json({ message: 'Invalid Supplier ID. Supplier not found or does not belong to this shop.' });
        }

        const existingProduct = await Product.findOne({ sku, shopId });
        if (existingProduct) {
            logger.warn(`Product creation failed: SKU ${sku} already exists in shop ${shopId}.`);
            return res.status(409).json({ message: `Product with SKU '${sku}' already exists in this shop.` });
        }

        const newProduct = new Product({
            name,
            sku,
            barcode,
            categoryId,
            supplierId,
            purchasePrice,
            sellingPrice,
            stockQuantity,
            minStockLevel,
            description,
            productImage,
            expirationDate,
            shopId,
            createdBy,
            isActive: true,
        });

        await newProduct.save();

        logger.info(`Product created successfully: ${newProduct.name} (SKU: ${newProduct.sku}) in shop ${shopId} by user ${createdBy}`);

        res.status(201).json({
            message: 'Product created successfully',
            product: newProduct,
        });

    } catch (error) {
        logger.error(`Error creating product: ${error.message}`);
        if (error.code === 11000 && error.message.includes('sku_1_shopId_1')) {
            return res.status(409).json({ message: `Product with SKU '${req.body.sku}' already exists in this shop.` });
        }
        res.status(500).json({ message: 'Server error creating product' });
    }
};

const getAllProducts = async (req, res, next) => {
    try {
        if (!req.user || !req.user.shopId) {
            logger.warn(`Get all products: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const shopId = req.user.shopId;

        const query = { shopId: shopId, isActive: true };

        if (req.query.search) {
            const searchTerm = req.query.search;
            query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { sku: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        if (req.query.categoryId) {
            query.categoryId = req.query.categoryId;
        }

        if (req.query.supplierId) {
            query.supplierId = req.query.supplierId;
        }

        if (req.query.expirationStatus === 'expiringSoon') {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            query.expirationDate = { $gte: new Date(), $lte: thirtyDaysFromNow };
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let productsQuery = Product.find(query)
            .populate('categoryId', 'name')
            .populate('supplierId', 'name')
            .populate('createdBy', 'name email role')
            .sort({ createdAt: -1 });

        const totalProducts = await Product.countDocuments(query);
        const products = await productsQuery.skip(skip).limit(limit);

        const totalPages = Math.ceil(totalProducts / limit);

        logger.info(`Retrieved ${products.length} products for shop ${shopId} (Page: ${page}, Limit: ${limit}). Total found: ${totalProducts}.`);

        res.status(200).json({
            products,
            pagination: {
                currentPage: page,
                limit: limit,
                totalDocs: totalProducts,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null,
            }
        });

    } catch (error) {
        logger.error(`Error fetching all products for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching products' });
    }
};

const getProductById = async (req, res, next) => {
    try {
        const productId = req.params.id;

        if (!req.user || !req.user.shopId) {
            logger.warn(`Get product by ID: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        const product = await Product.findOne({ _id: productId, shopId: req.user.shopId, isActive: true })
            .populate('categoryId', 'name')
            .populate('supplierId', 'name')
            .populate('createdBy', 'name email role');

        if (!product) {
            logger.warn(`Get product by ID: Product ${productId} not found in shop ${req.user.shopId}.`);
            return res.status(404).json({ message: 'Product not found in this shop.' });
        }

        logger.info(`Retrieved product ${productId} for shop ${req.user.shopId} by user ${req.user.email}.`);
        res.status(200).json(product);

    } catch (error) {
        logger.error(`Error fetching product ${req.params.id} for shop ${req.user.shopId}: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching product' });
    }
};

const updateProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;

        const { error, value } = updateProductSchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error during product update for ID ${productId}: ${error.details[0].message}`);
            return res.status(400).json({ message: error.details[0].message });
        }

        if (!req.user || !req.user.shopId) {
            logger.warn(`Update product: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot update products.`);
            return res.status(403).json({ message: 'Only owners and managers can update products.' });
        }

        const productToUpdate = await Product.findOne({ _id: productId, shopId: req.user.shopId, isActive: true });

        if (!productToUpdate) {
            logger.warn(`Update product: Product ${productId} not found in shop ${req.user.shopId}.`);
            return res.status(404).json({ message: 'Product not found in this shop.' });
        }

        if (value.categoryId) {
            const categoryExists = await checkReferenceOwnership(req.user.shopId, 'category', value.categoryId);
            if (!categoryExists) {
                logger.warn(`Product update failed: Category ID ${value.categoryId} not found or not in shop ${req.user.shopId}.`);
                return res.status(404).json({ message: 'Invalid Category ID. Category not found or does not belong to this shop.' });
            }
        }
        if (value.supplierId) {
            const supplierExists = await checkReferenceOwnership(req.user.shopId, 'supplier', value.supplierId);
            if (!supplierExists) {
                logger.warn(`Product update failed: Supplier ID ${value.supplierId} not found or not in shop ${req.user.shopId}.`);
                return res.status(404).json({ message: 'Invalid Supplier ID. Supplier not found or does not belong to this shop.' });
            }
        }

        if (value.sku && value.sku !== productToUpdate.sku) {
            const existingProductWithSku = await Product.findOne({ sku: value.sku, shopId: req.user.shopId, _id: { $ne: productId } });
            if (existingProductWithSku) {
                logger.warn(`Product update failed: SKU ${value.sku} already exists for another product in shop ${req.user.shopId}.`);
                return res.status(409).json({ message: `Product with SKU '${value.sku}' already exists in this shop.` });
            }
        }
        
        const updatedProduct = await Product.findByIdAndUpdate(productId, value, {
            new: true,
            runValidators: true,
        })
        .populate('categoryId', 'name')
        .populate('supplierId', 'name')
        .populate('createdBy', 'name email role');

        if (!updatedProduct) {
            logger.warn(`Update product: Product ${productId} not found during findByIdAndUpdate.`);
            return res.status(404).json({ message: 'Product not found.' });
        }

        logger.info(`Product ${updatedProduct.name} (SKU: ${updatedProduct.sku}) updated successfully by ${req.user.email}.`);
        res.status(200).json(updatedProduct);

    } catch (error) {
        logger.error(`Error updating product ${req.params.id}: ${error.message}`);
        if (error.code === 11000 && error.message.includes('sku_1_shopId_1')) {
            return res.status(409).json({ message: `Product with SKU '${req.body.sku}' already exists in this shop.` });
        }
        res.status(500).json({ message: 'Server error updating product' });
    }
};

const deleteProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;

        if (!req.user || !req.user.shopId) {
            logger.warn(`Delete product: User ${req.user ? req.user.email : 'unknown'} has no shopId.`);
            return res.status(403).json({ message: 'User is not associated with any shop.' });
        }

        if (req.user.role !== 'owner' && req.user.role !== 'manager') {
            logger.warn(`Authorization error: User ${req.user.email} (Role: ${req.user.role}) cannot delete products.`);
            return res.status(403).json({ message: 'Only owners and managers can delete products.' });
        }

        const productToDelete = await Product.findOne({ _id: productId, shopId: req.user.shopId, isActive: true });

        if (!productToDelete) {
            logger.warn(`Delete product: Product ${productId} not found or already inactive in shop ${req.user.shopId}.`);
            return res.status(404).json({ message: 'Product not found or already deactivated in this shop.' });
        }

        const deletedProduct = await Product.findByIdAndUpdate(productId, { isActive: false }, {
            new: true,
            runValidators: true,
        })
        .populate('categoryId', 'name')
        .populate('supplierId', 'name')
        .populate('createdBy', 'name email role');

        if (!deletedProduct) {
            logger.warn(`Delete product: Product ${productId} not found during findByIdAndUpdate for soft delete.`);
            return res.status(404).json({ message: 'Product not found.' });
        }

        logger.warn(`Product ${deletedProduct.name} (SKU: ${deletedProduct.sku}) soft-deleted by ${req.user.email}.`);
        res.status(200).json({
            message: 'Product has been deactivated successfully.',
            product: deletedProduct,
        });

    } catch (error) {
        logger.error(`Error soft-deleting product ${req.params.id}: ${error.message}`);
        res.status(500).json({ message: 'Server error deactivating product' });
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};