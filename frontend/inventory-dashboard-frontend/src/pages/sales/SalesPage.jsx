import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSales, createSaleThunk, updateSaleThunk, cancelSaleThunk, resetSaleState, clearSaleError } from '../../features/sales/saleSlice';
import DataTable from '../../components/common/DataTable';
import Layout from '../../layouts/MainLayout';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import SaleFormModal from '../../components/sales/SaleFormModal';
import { fetchProducts } from '../../features/products/productSlice';
import { useNavigate } from 'react-router-dom';

const SalesPage = () => {
    const dispatch = useDispatch();
    const { sales, status, error, pagination } = useSelector((state) => state.sales);
    const { products: productList } = useSelector((state) => state.products);
    const { token } = useSelector((state) => state.auth);
    const userRole = useSelector((state) => state.auth.user?.role);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSale, setCurrentSale] = useState(null);
    const [searchParams, setSearchParams] = useState({
        paymentStatus: '',
        paymentMethod: '',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 10,
    });

    const canCreateSale = userRole === 'owner' || userRole === 'manager' || userRole === 'staff';
    const canCancelSale = userRole === 'owner' || userRole === 'manager';

    const loadSales = useCallback(() => {
        dispatch(fetchSales({ token, params: searchParams }));
    }, [dispatch, token, searchParams]);

    useEffect(() => {
        loadSales();
        if (!productList || productList.length === 0) {
            dispatch(fetchProducts({ token, params: { limit: 1000 } }));
        }
        return () => {
            dispatch(resetSaleState());
        };
    }, [loadSales, dispatch, token, productList]);

    useEffect(() => {
        // Clear error on modal open/close
        if (isModalOpen) {
            dispatch(clearSaleError());
        }
    }, [isModalOpen, dispatch]);

    const handleOpenModal = (sale = null) => {
        if (!sale) return;
        setCurrentSale(sale);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentSale(null);
    };

    const handleSubmit = async (saleData) => {
        if (!currentSale) return;
        let resultAction;
        const updateData = {};
        if (saleData.paymentStatus !== currentSale.paymentStatus) {
            updateData.paymentStatus = saleData.paymentStatus;
        }
        if (saleData.notes !== currentSale.notes) {
            updateData.notes = saleData.notes;
        }

        if (Object.keys(updateData).length > 0) {
            resultAction = await dispatch(updateSaleThunk({ token, saleId: currentSale._id, saleData: updateData }));
            if (resultAction.meta.requestStatus === 'fulfilled') {
                loadSales();
            } else {
                alert(`Failed to update sale: ${resultAction.payload}`);
            }
        }
        handleCloseModal();
    };

    const handleCancelSale = async (saleId) => {
        if (!canCancelSale) {
            alert('You do not have permission to cancel sales.');
            return;
        }
        if (window.confirm('Are you sure you want to cancel this sale? Stock will be restored.')) {
            const resultAction = await dispatch(cancelSaleThunk({ token, saleId }));
            if (resultAction.meta.requestStatus === 'fulfilled') {
                loadSales();
            } else {
                alert(`Failed to cancel sale: ${resultAction.payload}`);
            }
        }
    };

    const handleCreateSaleNavigation = () => {
        if (!canCreateSale) {
            alert('You do not have permission to create sales.');
            return;
        }
        navigate('/sales/pos');
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
        { header: 'Customer', accessor: 'customerName' },
        { header: 'Date', accessor: 'createdAt', format: (date) => new Date(date).toLocaleString() },
        { header: 'Total', accessor: 'totalAmount', format: (amount) => `$${amount.toFixed(2)}` },
        { header: 'Payment Method', accessor: 'paymentMethod' },
        { header: 'Status', accessor: 'paymentStatus' },
        {
            header: 'Actions',
            cell: (row) => (
                <div className="flex space-x-2">
                    <button onClick={() => navigate(`/sales/${row._id}`)} className="text-blue-600 hover:text-blue-800">View</button>
                    <button onClick={() => handleOpenModal(row)} className="text-gray-600 hover:text-gray-800">Edit</button> 
                    {canCancelSale && (
                        <button onClick={() => handleCancelSale(row._id)} className="text-red-600 hover:text-red-800">Cancel</button>
                    )}
                </div>
            )
        }
    ];

    const paymentMethodOptions = [
        { value: '', label: 'All Payment Methods' },
        { value: 'CASH', label: 'Cash' },
        { value: 'CARD', label: 'Card' },
        { value: 'ONLINE', label: 'Online' },
    ];

    const paymentStatusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'PAID', label: 'Paid' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'FAILED', label: 'Failed' },
    ];

    const additionalFilters = [
        { id: 'paymentMethod', type: 'select', label: 'Payment Method', options: [{ value: '', label: 'All Payment Methods' }, ...paymentMethodOptions.slice(1)] },
        { id: 'paymentStatus', type: 'select', label: 'Payment Status', options: [{ value: '', label: 'All Statuses' }, ...paymentStatusOptions.slice(1)] },
        { id: 'startDate', type: 'date', label: 'Start Date' },
        { id: 'endDate', type: 'date', label: 'End Date' },
    ];

    return (
        <Layout>
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Sales History</h1>

                <div className="mb-6">
                    <SearchFilterBar
                        currentFilters={searchParams}
                        onFilterChange={handleFilterChange}
                        additionalFilters={additionalFilters}
                    />
                    {canCreateSale && (
                        <button onClick={handleCreateSaleNavigation} className="mt-4 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">
                            New Sale (POS)
                        </button>
                    )}
                </div>

                {status === 'loading' && <p>Loading sales...</p>}
                {error && <p className="text-red-500">Error: {error}</p>}

                {!error && sales && sales.length === 0 && status === 'succeeded' && <p>No sales found.</p>}

                {sales && sales.length > 0 && (
                    <DataTable
                        columns={columns}
                        data={sales}
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onLimitChange={handleLimitChange}
                    />
                )}

                {isModalOpen && (
                    <SaleFormModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onSubmit={handleSubmit}
                        sale={currentSale} 
                        isEditing={!!currentSale} 
                    />
                )}
            </div>
        </Layout>
    );
};

export default SalesPage;
