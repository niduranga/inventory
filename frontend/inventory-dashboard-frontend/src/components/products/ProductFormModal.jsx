import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../../features/categories/categorySlice';
import { fetchProducts, fetchProductById, updateProduct, clearProductError } from '../../features/products/productSlice';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';

const ProductFormModal = ({ isOpen, onClose, onSubmit, product, isEditing, categories, suppliers }) => {
    const dispatch = useDispatch();
    const { token } = useSelector((state) => state.auth);
    const { status, error } = useSelector((state) => state.products);

    const [formData, setFormData] = useState({
        name: product?.name || '',
        sku: product?.sku || '',
        barcode: product?.barcode || '',
        categoryId: product?.categoryId?._id || product?.categoryId || '',
        supplierId: product?.supplierId?._id || product?.supplierId || '',
        purchasePrice: product?.purchasePrice || 0,
        sellingPrice: product?.sellingPrice || 0,
        stockQuantity: product?.stockQuantity || 0,
        minStockLevel: product?.minStockLevel || 0,
        description: product?.description || '',
        productImage: product?.productImage || '',
        expirationDate: product?.expirationDate ? new Date(product.expirationDate).toISOString().split('T')[0] : '',
    });

    // Effect to set form data when product prop changes or when opening for creation
    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                sku: product.sku || '',
                barcode: product.barcode || '',
                categoryId: product.categoryId?._id || product.categoryId || '',
                supplierId: product.supplierId?._id || product.supplierId || '',
                purchasePrice: product.purchasePrice || 0,
                sellingPrice: product.sellingPrice || 0,
                stockQuantity: product.stockQuantity || 0,
                minStockLevel: product.minStockLevel || 0,
                description: product.description || '',
                productImage: product.productImage || '',
                expirationDate: product.expirationDate ? new Date(product.expirationDate).toISOString().split('T')[0] : '',
            });
        } else {
            // Reset form for new product
            setFormData({
                name: '', sku: '', barcode: '', categoryId: '', supplierId: '',
                purchasePrice: 0, sellingPrice: 0, stockQuantity: 0, minStockLevel: 0,
                description: '', productImage: '', expirationDate: '',
            });
        }
    }, [product]); // Dependency array includes 'product' prop

    // Clear error when modal opens or form data changes
    useEffect(() => {
        if (isOpen) {
            dispatch(clearProductError());
        }
    }, [isOpen, dispatch]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value, // Parse numbers correctly
        }));
        if (error) {
            dispatch(clearProductError());
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Product' : 'Add New Product'}>
            <form onSubmit={handleFormSubmit} className="space-y-4 p-4 md:p-6">
                <FormInput label="Product Name" name="name" value={formData.name} onChange={handleChange} required />
                <FormInput label="SKU" name="sku" value={formData.sku} onChange={handleChange} required />
                <FormInput label="Barcode" name="barcode" value={formData.barcode} onChange={handleChange} />

                <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                        id="categoryId"
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="">Select a Category</option>
                        {categories?.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700">Supplier</label>
                    <select
                        id="supplierId"
                        name="supplierId"
                        value={formData.supplierId}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="">Select a Supplier</option>
                        {suppliers?.map(sup => (
                            <option key={sup._id} value={sup._id}>{sup.name}</option>
                        ))}
                    </select>
                </div>

                <FormInput label="Purchase Price" name="purchasePrice" type="number" value={formData.purchasePrice} onChange={handleChange} required min="0" step="0.01" />
                <FormInput label="Selling Price" name="sellingPrice" type="number" value={formData.sellingPrice} onChange={handleChange} required min="0" step="0.01" />
                <FormInput label="Stock Quantity" name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleChange} required min="0" />
                <FormInput label="Minimum Stock Level" name="minStockLevel" type="number" value={formData.minStockLevel} onChange={handleChange} min="0" />
                <FormInput label="Description" name="description" value={formData.description} onChange={handleChange} isTextArea />
                <FormInput label="Product Image URL" name="productImage" value={formData.productImage} onChange={handleChange} type="url" />
                <FormInput label="Expiration Date" name="expirationDate" type="date" value={formData.expirationDate} onChange={handleChange} />

                {status === 'failed' && error && (
                    <div className="text-sm text-red-600 text-center">
                        {error}
                    </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none">Cancel</button>
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                    >
                        {status === 'loading' ? 'Saving...' : (isEditing ? 'Update Product' : 'Add Product')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ProductFormModal;
