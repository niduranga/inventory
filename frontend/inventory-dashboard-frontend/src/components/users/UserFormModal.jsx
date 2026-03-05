import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';
import { useDispatch, useSelector } from 'react-redux';
import { clearProductError } from '../../features/products/productSlice'; // Ensure this path is correct

const UserFormModal = ({ isOpen, onClose, onSubmit, user, isEditing, userRole }) => {
    const dispatch = useDispatch();
    const { status, error } = useSelector((state) => state.users);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || 'staff', // Default to staff if not editing or role not provided
        isActive: user?.isActive !== undefined ? user.isActive : true,
    });

    // Effect to clear error when modal opens
    useEffect(() => {
        if (isOpen) {
            dispatch(clearUserError());
        }
    }, [isOpen, dispatch]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
        if (error) {
            dispatch(clearUserError());
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const canChangeRole = userRole === 'owner' || userRole === 'superadmin'; // Only owner/superadmin can change roles

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit User' : 'Invite User'}>
            <form onSubmit={handleFormSubmit} className="space-y-4 p-4 md:p-6">
                <FormInput label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
                <FormInput label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required disabled={isEditing} /> {/* Email usually not editable or requires verification */}
                
                {canChangeRole && (
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="staff">Staff</option>
                            <option value="manager">Manager</option>
                            <option value="owner">Owner</option>
                            {/* Superadmin role is usually managed by initial setup or specific superadmin tools */}
                        </select>
                    </div>
                )}
                {!isEditing && (
                    <p className="text-sm text-gray-500">A temporary password will be sent via email upon invitation.</p>
                )}

                {isEditing && (
                    <div>
                        <label htmlFor="isActive" className="flex items-center">
                            <input
                                id="isActive"
                                name="isActive"
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Is Active</span>
                        </label>
                    </div>
                )}

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
                        {status === 'loading' ? (isEditing ? 'Updating...' : 'Inviting...') : (isEditing ? 'Update User' : 'Invite User')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default UserFormModal;
