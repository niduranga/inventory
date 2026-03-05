import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProducts, addProduct, updateProduct, deleteProductThunk, resetProductState } from '../../features/products/productSlice';
import DataTable from '../../components/common/DataTable';
import ProductFormModal from '../../components/products/ProductFormModal';
import Layout from '../../layouts/MainLayout';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { fetchCategories } from '../../features/categories/categorySlice'; // For filter options
import { fetchSuppliers } from '../../features/suppliers/supplierSlice'; // For filter options

const ProductsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { products, status, error, pagination } = useSelector((state) => state.products);
    const { categories } = useSelector((state) => state.categories);
    const { suppliers } = useSelector((state) => state.suppliers);
    const { token } = useSelector((state) => state.auth);
    const userRole = useSelector((state) => state.auth.user?.role);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [searchParams, setSearchParams] = useState({
        search: '',
        categoryId: '',
        supplierId: '',
        page: 1,
        limit: 10,
        expirationStatus: '', // Add expiration status filter
        stockStatus: '', // Add stock status filter
    });

    const canCreateEditDelete = userRole === 'owner' || userRole === 'manager';

    const loadProducts = useCallback(() => {
        dispatch(fetchProducts({ token, params: searchParams }));
    }, [dispatch, token, searchParams]);

    useEffect(() => {
        loadProducts();
        dispatch(fetchCategories({ token, params: { limit: 1000 } })); // Fetch all categories for filter dropdown
        dispatch(fetchSuppliers({ token, params: { limit: 1000 } })); // Fetch all suppliers for filter dropdown

        return () => {
            dispatch(resetProductState());
        };
    }, [loadProducts, dispatch, token]);

    const handleOpenModal = (product = null) => {
        if (!canCreateEditDelete && product === null) { // Prevent staff from opening add modal
            alert('You do not have permission to add products.');
            return;
        }
        setCurrentProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentProduct(null);
    };

    const handleSubmit = async (productData) => {
        if (!canCreateEditDelete) return;
        let resultAction;
        if (currentProduct) {
            resultAction = await dispatch(updateProduct({ token, productId: currentProduct._id, productData }));
        } else {
            resultAction = await dispatch(addProduct({ token, productData }));
        }

        if (resultAction.meta.requestStatus === 'fulfilled') {
            handleCloseModal();
            loadProducts();
        } else {
            // Error will be in Redux state and can be displayed by the modal/form
        }
    };

    const handleDelete = async (productId) => {
        if (!canCreateEditDelete) {
            alert('You do not have permission to delete products.');
            return;
        }
        if (window.confirm('Are you sure you want to delete this product?')) {
            const resultAction = await dispatch(deleteProductThunk({ token, productId }));
            if (resultAction.meta.requestStatus === 'fulfilled') {
                loadProducts();
            } else {
                alert(`Failed to delete product: ${resultAction.payload}`);
            }
        }
    };

    const handleFilterChange = (newFilters) => {
        setSearchParams({ ...searchParams, ...newFilters, page: 1 });
    };

    const handlePageChange = (page) => {
        setSearchParams({ ...searchParams, page: page });
    };

    const handleLimitChange = (limit) => {
        setSearchParams({ ...searchParams, limit: limit, page: 1 });
    };

    const columns = [
        { header: 'Name', accessor: 'name' },
        { header: 'SKU', accessor: 'sku' },
        { header: 'Category', accessor: 'categoryId.name' },
        { header: 'Supplier', accessor: 'supplierId.name' },
        { header: 'Stock', accessor: 'stockQuantity' },
        { header: 'Min Stock', accessor: 'minStockLevel' },
        { header: 'Exp. Date', accessor: 'expirationDate', format: (date) => date ? new Date(date).toLocaleDateString() : 'N/A' },
        { header: 'Selling Price', accessor: 'sellingPrice', format: (price) => `$${price.toFixed(2)}` },
        {
            header: 'Actions',
            cell: (row) => (
                <div className="flex space-x-2">
                    {canCreateEditDelete && (
                        <button onClick={() => handleOpenModal(row)} className="text-blue-600 hover:text-blue-800">
                            Edit
                        </button>
                    )}
                    {canCreateEditDelete && (
                        <button onClick={() => handleDelete(row._id)} className="text-red-600 hover:text-red-800">
                            Delete
                        </button>
                    )}
                     <button onClick={() => navigate(`/products/${row._id}`)} className="text-gray-600 hover:text-gray-800">
                        View
                    </button>
                </div>
            )
        }
    ];

    // Options for category and supplier filters
    const categoryOptions = categories.map(cat => ({ value: cat._id, label: cat.name }));
    const supplierOptions = suppliers.map(sup => ({ value: sup._id, label: sup.name }));

    const additionalFilters = [
        { id: 'categoryId', type: 'select', label: 'Category', options: [{ value: '', label: 'All Categories' }, ...categoryOptions] },
        { id: 'supplierId', type: 'select', label: 'Supplier', options: [{ value: '', label: 'All Suppliers' }, ...supplierOptions] },
        { id: 'stockStatus', type: 'select', label: 'Stock Status', options: [
            { value: '', label: 'All Stock' },
            { value: 'low', label: 'Low Stock' }, // Requires backend support
        ] },
        { id: 'expirationStatus', type: 'select', label: 'Expiration', options: [
            { value: '', label: 'All' },
            { value: 'expiringSoon', label: 'Expiring Soon' }, // Requires backend support
        ] },
    ];

    return (
        <Layout>
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Products</h1>

                <div className="mb-6">
                    <SearchFilterBar
                        currentFilters={searchParams}
                        onFilterChange={handleFilterChange}
                        additionalFilters={additionalFilters}
                    />
                    {canCreateEditDelete && (
                        <button onClick={() => handleOpenModal()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                            Add New Product
                        </button>
                    )}
                </div>

                {status === 'loading' && <p>Loading products...</p>}
                {error && <p className="text-red-500">Error: {error}</p>}

                {!error && products && products.length === 0 && status === 'succeeded' && <p>No products found.</p>}

                {products && products.length > 0 && (
                    <DataTable
                        columns={columns}
                        data={products}
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onLimitChange={handleLimitChange}
                    />
                )}

                {isModalOpen && (
                    <ProductFormModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onSubmit={handleSubmit}
                        product={currentProduct}
                        isEditing={!!currentProduct}
                        categories={categories} // Pass categories for dropdown
                        suppliers={suppliers} // Pass suppliers for dropdown
                    />
                )}
            </div>
        </Layout>
    );
};

export default ProductsPage;
