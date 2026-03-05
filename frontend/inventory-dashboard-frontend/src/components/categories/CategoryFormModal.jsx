import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';
import { useDispatch, useSelector } from 'react-redux';
import { clearCategoryError } from '../../features/categories/categorySlice'; // Ensure correct path

const CategoryFormModal = ({ isOpen, onClose, onSubmit, category, isEditing }) => {
    const dispatch = useDispatch();
    const { status, error } = useSelector((state) => state.categories);

    const [formData, setFormData] = useState({
        name: category?.name || '',
        description: category?.description || '',
    });

    useEffect(() => {
        if (isOpen) {
            dispatch(clearCategoryError());
        }
    }, [isOpen, dispatch]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Category' : 'Add New Category'}>
            <form onSubmit={handleFormSubmit} className="space-y-4 p-4 md:p-6">
                <FormInput label="Category Name" name="name" value={formData.name} onChange={handleChange} required />
                <FormInput label="Description" name="description" value={formData.description} onChange={handleChange} isTextArea />
                
                <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50">{isEditing ? 'Update Category' : 'Add Category'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default CategoryFormModal;
