import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, inviteUserThunk, updateUserThunk, deleteUserThunk, resetUserState } from '../../features/users/userSlice';
import DataTable from '../../components/common/DataTable';
import UserFormModal from '../../components/users/UserFormModal';
import Layout from '../../layouts/MainLayout';
import SearchFilterBar from '../../components/common/SearchFilterBar';

const UsersPage = () => {
    const dispatch = useDispatch();
    const { users, status, error, pagination } = useSelector((state) => state.users);
    const { token } = useSelector((state) => state.auth);
    const userRole = useSelector((state) => state.auth.user?.role);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchParams, setSearchParams] = useState({
        search: '',
        role: '', // Filter by role
        isActive: null, // Filter by active status
        page: 1,
        limit: 10,
    });

    const canInviteUpdateDelete = userRole === 'owner' || userRole === 'manager' || userRole === 'superadmin';
    const canInvite = userRole === 'owner' || userRole === 'manager' || userRole === 'superadmin';

    const loadUsers = useCallback(() => {
        dispatch(fetchUsers({ token, params: searchParams }));
    }, [dispatch, token, searchParams]);

    useEffect(() => {
        loadUsers();
        return () => {
            dispatch(resetUserState());
        };
    }, [loadUsers]);

    const handleOpenModal = (user = null) => {
        if (!canInviteUpdateDelete && user === null) return;
        setCurrentUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentUser(null);
    };

    const handleSubmit = async (userData) => {
        if (!canInviteUpdateDelete) return;
        let resultAction;
        if (currentUser) {
            resultAction = await dispatch(updateUserThunk({ token, userId: currentUser._id, userData }));
        } else {
            // Invite user flow
            resultAction = await dispatch(inviteUserThunk({ token, userData }));
        }

        if (resultAction.meta.requestStatus === 'fulfilled') {
            handleCloseModal();
            loadUsers();
        }
    };

    const handleDelete = async (userId) => {
        if (!canInviteUpdateDelete) {
            alert('You do not have permission to delete users.');
            return;
        }
        if (window.confirm('Are you sure you want to deactivate this user?')) {
            const resultAction = await dispatch(deleteUserThunk({ token, userId }));
            if (resultAction.meta.requestStatus === 'fulfilled') {
                loadUsers();
            } else {
                alert(`Failed to deactivate user: ${resultAction.payload}`);
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
        { header: 'Email', accessor: 'email' },
        { header: 'Role', accessor: 'role' },
        { header: 'Status', accessor: 'isActive', format: (isActive) => isActive ? 'Active' : 'Inactive' },
        { header: 'Created At', accessor: 'createdAt', format: (date) => new Date(date).toLocaleString() },
        {
            header: 'Actions',
            cell: (row) => (
                <div className="flex space-x-2">
                    {canInviteUpdateDelete && (
                        <button onClick={() => handleOpenModal(row)} className="text-blue-600 hover:text-blue-800">Edit</button>
                    )}
                    {canInviteUpdateDelete && row.role !== 'superadmin' && (
                        <button onClick={() => handleDelete(row._id)} className="text-red-600 hover:text-red-800">Deactivate</button>
                    )}
                </div>
            )
        }
    ];

    const roleOptions = [
        { value: '', label: 'All Roles' },
        { value: 'owner', label: 'Owner' },
        { value: 'manager', label: 'Manager' },
        { value: 'staff', label: 'Staff' },
    ];

    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: true, label: 'Active' },
        { value: false, label: 'Inactive' },
    ];

    const additionalFilters = [
        { id: 'role', type: 'select', label: 'Role', options: [{ value: '', label: 'All Roles' }, ...roleOptions.slice(1)] }, // Slice to exclude 'All Roles' option if needed, or add explicitly
        { id: 'isActive', type: 'select', label: 'Status', options: [{ value: '', label: 'All Status' }, ...statusOptions.slice(1)] }, // Slice to exclude 'All Status' option if needed, or add explicitly
    ];

    return (
        <Layout>
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Users</h1>

                <div className="mb-6">
                    <SearchFilterBar
                        currentFilters={searchParams}
                        onFilterChange={handleFilterChange}
                        additionalFilters={additionalFilters}
                    />
                    {canInvite && (
                        <button onClick={() => handleOpenModal()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                            Invite New User
                        </button>
                    )}
                </div>

                {status === 'loading' && <p>Loading users...</p>}
                {error && <p className="text-red-500">Error: {error}</p>}

                {!error && users && users.length === 0 && status === 'succeeded' && <p>No users found.</p>}

                {users && users.length > 0 && (
                    <DataTable
                        columns={columns}
                        data={users}
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onLimitChange={handleLimitChange}
                    />
                )}

                {isModalOpen && (
                    <UserFormModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onSubmit={handleSubmit}
                        user={currentUser}
                        isEditing={!!currentUser}
                        userRole={userRole} // Pass current user role for permission checks in modal
                    />
                )}
            </div>
        </Layout>
    );
};

export default UsersPage;
