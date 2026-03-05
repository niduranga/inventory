import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// Ensure imports are correct
import { fetchCategories, addCategory, updateCategoryThunk, deleteCategoryThunk, resetCategoryState, clearCategoryError } from '../../features/categories/categorySlice';
import DataTable from '../../components/common/DataTable';
import CategoryFormModal from '../../components/categories/CategoryFormModal';
import Layout from '../../layouts/MainLayout';
import SearchFilterBar from '../../components/common/SearchFilterBar';

const CategoriesPage = () => {
    const dispatch = useDispatch();
    const { categories, status, error, pagination } = useSelector((state) => state.categories);
    const { token } = useSelector((state) => state.auth);
    const userRole = useSelector((state) => state.auth.user?.role);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [searchParams, setSearchParams] = useState({
        search: '',
        page: 1,
        limit: 10,
    });

    const canCreateEditDelete = userRole === 'owner' || userRole === 'manager';

    const loadCategories = useCallback(() => {
        dispatch(fetchCategories({ token, params: searchParams }));
    }, [dispatch, token, searchParams]);

    useEffect(() => {
        loadCategories();
        return () => {
            dispatch(resetCategoryState());
        };
    }, [loadCategories, dispatch]); // Added dispatch dependency

    useEffect(() => {
        if (isModalOpen) {
            dispatch(clearCategoryError());
        }
    }, [isModalOpen, dispatch]); // Added dispatch dependency

    const handleOpenModal = (category = null) => {
        if (!canCreateEditDelete && category === null) return;
        setCurrentCategory(category);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentCategory(null);
    };

    const handleSubmit = async (categoryData) => {
        if (!canCreateEditDelete) return;
        let resultAction;
        if (currentCategory) {
            resultAction = await dispatch(updateCategoryThunk({ token, categoryId: currentCategory._id, categoryData }));
        } else {
            resultAction = await dispatch(addCategory({ token, categoryData }));
        }

        if (resultAction.meta.requestStatus === 'fulfilled') {
            handleCloseModal();
            loadCategories();
        }
    };

    const handleDelete = async (categoryId) => {
        if (!canCreateEditDelete) {
            alert('You do not have permission to delete categories.');
            return;
        }
        if (window.confirm('Are you sure you want to delete this category?')) {
            const resultAction = await dispatch(deleteCategoryThunk({ token, categoryId }));
            if (resultAction.meta.requestStatus === 'fulfilled') {
                loadCategories();
            } else {
                alert(`Failed to delete category: ${resultAction.payload}`);
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
        { header: 'Description', accessor: 'description' },
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
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Categories</h1>

                <div className="mb-6">
                    <SearchFilterBar
                        currentFilters={searchParams}
                        onFilterChange={handleFilterChange}
                        additionalFilters={[]}
                    />
                    {canCreateEditDelete && (
                        <button onClick={() => handleOpenModal()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                            Add New Category
                        </button>
                    )}
                </div>

                {status === 'loading' && <p>Loading categories...</p>}
                {error && <p className="text-red-500">Error: {error}</p>}

                {!error && categories && categories.length === 0 && status === 'succeeded' && <p>No categories found.</p>}

                {categories && categories.length > 0 && (
                    <DataTable
                        columns={columns}
                        data={categories}
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onLimitChange={handleLimitChange}
                    />
                )}

                {isModalOpen && (
                    <CategoryFormModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onSubmit={handleSubmit}
                        category={currentCategory}
                        isEditing={!!currentCategory}
                    />
                )}
            </div>
        </Layout>
    );
};

export default CategoriesPage;
