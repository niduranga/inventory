import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInventoryReports, resetInventoryState, clearInventoryError } from '../../features/inventory/inventorySlice';
import DataTable from '../../components/common/DataTable';
import Layout from '../../layouts/MainLayout';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { fetchProducts } from '../../features/products/productSlice';

const InventoryPage = () => {
    const dispatch = useDispatch();
    const { inventoryReport, status, error, pagination } = useSelector((state) => state.inventory);
    const { products: productList } = useSelector((state) => state.products); 
    const { token } = useSelector((state) => state.auth);
    const userRole = useSelector((state) => state.auth.user?.role);

    const [searchParams, setSearchParams] = useState({
        categoryId: '',
        supplierId: '',
        stockStatus: '', 
        expirationStatus: '', 
        page: 1,
        limit: 10,
    });

    const loadInventory = useCallback(() => {
        dispatch(fetchInventoryReports({ token, params: searchParams }));
    }, [dispatch, token, searchParams]);

    useEffect(() => {
        loadInventory();
        if (!productList || productList.length === 0) {
            dispatch(fetchProducts({ token, params: { limit: 1000 } }));
        }
        return () => {
            dispatch(resetInventoryState());
        };
    }, [loadInventory, dispatch, token, productList]);

    useEffect(() => {
        if (isOpen) {
            dispatch(clearInventoryError());
        }
    }, [isOpen, dispatch]);

    const handleFilterChange = (newFilters) => {
        setSearchParams({ ...searchParams, ...newFilters, page: 1 });
    };

    const handlePageChange = (page) => {
        setSearchParams({ ...searchParams, page: page });
    };

    const handleLimitChange = (limit) => {
        setSearchParams({ ...searchParams, limit: limit, page: 1 });
    };

    // Deduplicate categories and suppliers for filter options
    const uniqueCategories = [...new Map(productList?.map(item => [item.categoryId._id, item.categoryId])).values()];
    const uniqueSuppliers = [...new Map(productList?.map(item => [item.supplierId._id, item.supplierId])).values()];

    const categoryOptions = uniqueCategories.map(cat => ({ value: cat._id, label: cat.name }));
    const supplierOptions = uniqueSuppliers.map(sup => ({ value: sup._id, label: sup.name }));

    const columns = [
        { header: 'Product Name', accessor: 'name' },
        { header: 'SKU', accessor: 'sku' },
        { header: 'Current Stock', accessor: 'stockQuantity' },
        { header: 'Min Stock', accessor: 'minStockLevel' },
        { header: 'Expiration Date', accessor: 'expirationDate', format: (date) => date ? new Date(date).toLocaleDateString() : 'N/A' },
    ];

    const additionalFilters = [
        { id: 'categoryId', type: 'select', label: 'Category', options: [{ value: '', label: 'All Categories' }, ...categoryOptions] },
        { id: 'supplierId', type: 'select', label: 'Supplier', options: [{ value: '', label: 'All Suppliers' }, ...supplierOptions] },
        { id: 'stockStatus', type: 'select', label: 'Stock Status', options: [
            { value: '', label: 'All Stock' },
            { value: 'low', label: 'Low Stock' },
        ] },
        { id: 'expirationStatus', type: 'select', label: 'Expiration Status', options: [
            { value: '', label: 'All' },
            { value: 'expiringSoon', label: 'Expiring Soon (30 days)' },
        ] },
    ];

    return (
        <Layout>
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Inventory Report</h1>

                <div className="mb-6">
                    <SearchFilterBar
                        currentFilters={searchParams}
                        onFilterChange={handleFilterChange}
                        additionalFilters={additionalFilters}
                    />
                </div>

                {status === 'loading' && <p>Loading inventory data...</p>}
                {error && <p className="text-red-500">Error: {error}</p>}

                {!error && inventoryReport && inventoryReport.data?.currentStock?.length === 0 && status === 'succeeded' && <p>No inventory data found.</p>}

                {inventoryReport && inventoryReport.data?.currentStock && inventoryReport.data.currentStock.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Current Stock Levels</h2>
                        <DataTable
                            columns={columns}
                            data={inventoryReport.data.currentStock}
                            pagination={inventoryReport.pagination} 
                            onPageChange={handlePageChange}
                            onLimitChange={handleLimitChange}
                        />
                    </div>
                )}

                {inventoryReport && inventoryReport.data?.lowStockItems?.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-semibold mb-4">Low Stock Items</h2>
                        <DataTable columns={columns.slice(0, -1)} data={inventoryReport.data.lowStockItems} /> 
                    </div>
                )}
                {inventoryReport && inventoryReport.data?.expiringProducts?.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-semibold mb-4">Expiring Soon</h2>
                        <DataTable columns={columns.slice(0, -1)} data={inventoryReport.data.expiringProducts} /> 
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default InventoryPage;
