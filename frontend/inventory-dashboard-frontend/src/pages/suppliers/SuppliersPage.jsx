import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSuppliers, addSupplier, updateSupplierThunk, deleteSupplierThunk, resetSupplierState, clearSupplierError } from '../../features/suppliers/supplierSlice';
import DataTable from '../../components/common/DataTable';
import SupplierFormModal from '../../components/suppliers/SupplierFormModal';
import Layout from '../../layouts/MainLayout';
import SearchFilterBar from '../../components/common/SearchFilterBar';

const SuppliersPage = () => {
    const dispatch = useDispatch();
    const { suppliers, status, error, pagination } = useSelector((state) => state.suppliers);
    const { token } = useSelector((state) => state.auth);
    const userRole = useSelector((state) => state.auth.user?.role);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState(null);
    const [searchParams, setSearchParams] = useState({
        search: '',
        page: 1,
        limit: 10,
    });

    const canCreateEditDelete = userRole === 'owner' || userRole === 'manager';

    const loadSuppliers = useCallback(() => {
        dispatch(fetchSuppliers({ token, params: searchParams }));
    }, [dispatch, token, searchParams]);

    useEffect(() => {
        loadSuppliers();
        return () => {
            dispatch(resetSupplierState());
        };
    }, [loadSuppliers]);

    useEffect(() => {
        if (isModalOpen) {
            dispatch(clearSupplierError());
        }
    }, [isModalOpen, dispatch]);

    const handleOpenModal = (supplier = null) => {
        if (!canCreateEditDelete && supplier === null) return;
        setCurrentSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentSupplier(null);
    };

    const handleSubmit = async (supplierData) => {
        if (!canCreateEditDelete) return;
        let resultAction;
        if (currentSupplier) {
            resultAction = await dispatch(updateSupplierThunk({ token, supplierId: currentSupplier._id, supplierData }));
        } else {
            resultAction = await dispatch(addSupplier({ token, supplierData }));
        }

        if (resultAction.meta.requestStatus === 'fulfilled') {
            handleCloseModal();
            loadSuppliers();
        }
    };

    const handleDelete = async (supplierId) => {
        if (!canCreateEditDelete) {
            alert('You do not have permission to delete suppliers.');
            return;
        }
        if (window.confirm('Are you sure you want to delete this supplier?')) {
            const resultAction = await dispatch(deleteSupplierThunk({ token, supplierId }));
            if (resultAction.meta.requestStatus === 'fulfilled') {
                loadSuppliers();
            } else {
                alert(`Failed to delete supplier: ${resultAction.payload}`);
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
        { header: 'Contact Person', accessor: 'contactPerson' },
        { header: 'Email', accessor: 'email' },
        { header: 'Phone', accessor: 'phone' },
        { header: 'Address', accessor: 'address' },
        { header: 'Created By', accessor: 'createdBy.name' },
        {
            header: 'Actions',
            cell: (row) => (
                <div className="flex space-x-2">
                    {canCreateEditDelete && (
                        <button onClick={() => handleOpenModal(row)} className="text-blue-600 hover:text-blue-800">Edit</button>
                    )}
                    {canCreateEditDelete && (
                        <button onClick={() => handleDelete(row._id)} className="text-red-600 hover:text-red-800">Delete</button>
                    )}
                </div>
            )
        }
    ];

    return (
        <Layout>
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Suppliers</h1>

                <div className="mb-6">
                    <SearchFilterBar
                        currentFilters={searchParams}
                        onFilterChange={handleFilterChange}
                        additionalFilters={[]}
                    />
                    {canCreateEditDelete && (
                        <button onClick={() => handleOpenModal()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                            Add New Supplier
                        </button>
                    )}
                </div>

                {status === 'loading' && <p>Loading suppliers...</p>}
                {error && <p className="text-red-500">Error: {error}</p>}

                {!error && suppliers && suppliers.length === 0 && status === 'succeeded' && <p>No suppliers found.</p>}

                {suppliers && suppliers.length > 0 && (
                    <DataTable
                        columns={columns}
                        data={suppliers}
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onLimitChange={handleLimitChange}
                    />
                )}

                {isModalOpen && (
                    <SupplierFormModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onSubmit={handleSubmit}
                        supplier={currentSupplier}
                        isEditing={!!currentSupplier}
                    />
                )}
            </div>
        </Layout>
    );
};

export default SuppliersPage;
