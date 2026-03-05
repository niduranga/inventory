import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';

const SupplierFormModal = ({ isOpen, onClose, onSubmit, supplier, isEditing }) => {
    const [formData, setFormData] = useState({
        name: supplier?.name || '',
        contactPerson: supplier?.contactPerson || '',
        email: supplier?.email || '',
        phone: supplier?.phone || '',
        address: supplier?.address || '',
    });

    useEffect(() => {
        // Clear form when modal opens or supplier prop changes
        if (isOpen) {
            setFormData({
                name: supplier?.name || '',
                contactPerson: supplier?.contactPerson || '',
                email: supplier?.email || '',
                phone: supplier?.phone || '',
                address: supplier?.address || '',
            });
        } else {
            // Reset form if modal is closed
            setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '' });
        }
    }, [isOpen, supplier]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Supplier' : 'Add New Supplier'}>
            <form onSubmit={handleFormSubmit} className="space-y-4 p-4 md:p-6">
                <FormInput label="Supplier Name" name="name" value={formData.name} onChange={handleChange} required />
                <FormInput label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleChange} />
                <FormInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
                <FormInput label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
                <FormInput label="Address" name="address" value={formData.address} onChange={handleChange} isTextArea />
                
                <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50">{isEditing ? 'Update Supplier' : 'Add Supplier'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default SupplierFormModal;
