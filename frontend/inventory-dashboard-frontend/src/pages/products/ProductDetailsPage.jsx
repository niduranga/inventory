import React from 'react';
import Layout from '../../layouts/MainLayout';
import { useSelector } from 'react-redux';

const ProductDetailsPage = () => {
    const { product } = useSelector((state) => state.products);
    const { token } = useSelector((state) => state.auth);

    // This page would typically fetch product details using dispatch(fetchProductById({ token, id }))
    // For now, it assumes product data is available in the redux store if navigated from a list.
    // In a real app, you'd get the ID from the URL params.

    if (!product) {
        return <Layout><div>Product not found or not loaded.</div></Layout>;
    }

    return (
        <Layout>
            <div className="container mx-auto p-6 bg-white shadow-md rounded-lg">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">{product.name}</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-lg font-semibold text-gray-700">SKU:</p>
                        <p className="text-xl text-gray-900">{product.sku}</p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-gray-700">Barcode:</p>
                        <p className="text-xl text-gray-900">{product.barcode || 'N/A'}</p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-lg font-semibold text-gray-700">Category:</p>
                        <p className="text-xl text-gray-900">{product.categoryId?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-gray-700">Supplier:</p>
                        <p className="text-xl text-gray-900">{product.supplierId?.name || 'N/A'}</p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-lg font-semibold text-gray-700">Purchase Price:</p>
                        <p className="text-xl text-gray-900">${product.purchasePrice?.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-gray-700">Selling Price:</p>
                        <p className="text-xl text-gray-900">${product.sellingPrice?.toFixed(2)}</p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-grid-cols-2 gap-6">
                    <div>
                        <p className="text-lg font-semibold text-gray-700">Stock Quantity:</p>
                        <p className="text-xl text-gray-900">{product.stockQuantity}</p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-gray-700">Minimum Stock Level:</p>
                        <p className="text-xl text-gray-900">{product.minStockLevel}</p>
                    </div>
                </div>

                {product.expirationDate && (
                    <div className="mt-6">
                        <p className="text-lg font-semibold text-gray-700">Expiration Date:</p>
                        <p className="text-xl text-gray-900">{new Date(product.expirationDate).toLocaleDateString()}</p>
                    </div>
                )}

                {product.description && (
                    <div className="mt-6">
                        <p className="text-lg font-semibold text-gray-700">Description:</p>
                        <p className="text-gray-700">{product.description}</p>
                    </div>
                )}

                {product.productImage && (
                    <div className="mt-6">
                        <p className="text-lg font-semibold text-gray-700">Product Image:</p>
                        <img src={product.productImage} alt={product.name} className="max-w-xs max-h-48 object-contain rounded-lg shadow-inner" />
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ProductDetailsPage;
