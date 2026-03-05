import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPurchases, createPurchaseThunk, updatePurchaseThunk, deletePurchaseThunk, resetPurchaseState } from '../../features/purchases/purchaseSlice';
import DataTable from '../../components/common/DataTable';
import PurchaseFormModal from '../../components/purchases/PurchaseFormModal';
import Layout from '../../layouts/MainLayout';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { fetchSuppliers } from '../../features/suppliers/supplierSlice';
import { fetchProducts } from '../../features/products/productSlice';

const PurchasesPage = () => {
    const dispatch = useDispatch();
    const { purchases, status, error, pagination } = useSelector((state) => state.purchases);
    const { suppliers } = useSelector((state) => state.suppliers);
    const { products: productList } = useSelector((state) => state.products);
    const { token } = useSelector((state) => state.auth);
    const userRole = useSelector((state) => state.auth.user?.role);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPurchase, setCurrentPurchase] = useState(null);
    const [searchParams, setSearchParams] = useState({
        supplierId: '',
        paymentStatus: '',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 10,
    });

    const canCreateEditDelete = userRole === 'owner' || userRole === 'manager';

    const loadPurchases = useCallback(() => {
        dispatch(fetchPurchases({ token, params: searchParams }));
    }, [dispatch, token, searchParams]);

    useEffect(() => {
        loadPurchases();
        dispatch(fetchSuppliers({ token, params: { limit: 1000 } }));
        if (!productList || productList.length === 0) {
            dispatch(fetchProducts({ token, params: { limit: 1000 } }));
        }
        return () => {
            dispatch(resetPurchaseState());
        };
    }, [loadPurchases, dispatch, token, productList]);

    const handleOpenModal = (purchase = null) => {
        if (!canCreateEditDelete && purchase === null) return;
        setCurrentPurchase(purchase);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentPurchase(null);
    };

    const handleSubmit = async (purchaseData) => {
        if (!canCreateEditDelete) return;
        let resultAction;
        if (currentPurchase) {
            const { products, ...metadata } = purchaseData;
            resultAction = await dispatch(updatePurchaseThunk({ token, purchaseId: currentPurchase._id, purchaseData: metadata }));
        } else {
            resultAction = await dispatch(createPurchaseThunk({ token, purchaseData }));
        }

        if (resultAction.meta.requestStatus === 'fulfilled') {
            handleCloseModal();
            loadPurchases();
        }
    };

    const handleDelete = async (purchaseId) => {
        if (!canCreateEditDelete) {
            alert('You do not have permission to delete purchases.');
            return;
        }
        if (window.confirm('Are you sure you want to deactivate this purchase?')) {
            const resultAction = await dispatch(deletePurchaseThunk({ token, purchaseId }));
            if (resultAction.meta.requestStatus === 'fulfilled') {
                loadPurchases();
            } else {
                alert(`Failed to deactivate purchase: ${resultAction.payload}`);
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
        { header: 'Receipt #', accessor: 'receiptNumber' },
        { header: 'Supplier', accessor: 'supplierId.name' },
        { header: 'Date', accessor: 'purchaseDate', format: (date) => new Date(date).toLocaleString() },
        { header: 'Total', accessor: 'finalAmount', format: (amount) => `$${amount.toFixed(2)}` },
        { header: 'Payment Status', accessor: 'paymentStatus' },
        { header: 'Created By', accessor: 'createdBy.name' },
        {
            header: 'Actions',
            cell: (row) => (
                <div className="flex space-x-2">
                    <button onClick={() => navigate(`/purchases/${row._id}`)} className="text-blue-600 hover:text-blue-800">View</button>
                    {canCreateEditDelete && (
                        <button onClick={() => handleOpenModal(row)} className="text-gray-600 hover:text-gray-800">Edit</button>
                    )}
                    {canCreateEditDelete && (
                        <button onClick={() => handleDelete(row._id)} className="text-red-600 hover:text-red-800">Deactivate</button>
                    )}
                </div>
            )
        }
    ];

    const paymentStatusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'PAID', label: 'Paid' },
        { value: 'PARTIAL', label: 'Partial' },
        { value: 'PENDING', label: 'Pending' },
    ];

    const supplierOptions = suppliers.map(sup => ({ value: sup._id, label: sup.name }));

    const additionalFilters = [
        { id: 'supplierId', type: 'select', label: 'Supplier', options: [{ value: '', label: 'All Suppliers' }, ...supplierOptions] },
        { id: 'paymentStatus', type: 'select', label: 'Payment Status', options: [{ value: '', label: 'All Statuses' }, ...paymentStatusOptions.slice(1)] },
        { id: 'startDate', type: 'date', label: 'Start Date' },
        { id: 'endDate', type: 'date', label: 'End Date' },
    ];

    return (
        <Layout>
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Purchases</h1>

                <div className="mb-6">
                    <SearchFilterBar
                        currentFilters={searchParams}
                        onFilterChange={handleFilterChange}
                        additionalFilters={additionalFilters}
                    />
                    {canCreateEditDelete && (
                        <button onClick={() => handleOpenModal()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                            Add New Purchase
                        </button>
                    )}
                </div>

                {status === 'loading' && <p>Loading purchases...</p>}
                {error && <p className="text-red-500">Error: {error}</p>}

                {!error && purchases && purchases.length === 0 && status === 'succeeded' && <p>No purchases found.</p>}

                {purchases && purchases.length > 0 && (
                    <DataTable
                        columns={columns}
                        data={purchases}
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onLimitChange={handleLimitChange}
                    />
                )}

                {isModalOpen && (
                    <PurchaseFormModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onSubmit={handleSubmit}
                        purchase={currentPurchase}
                        isEditing={!!currentPurchase}
                        suppliers={suppliers}
                        products={productList}
                    />
                )}
            </div>
        </Layout>
    );
};

export default PurchasesPage;
