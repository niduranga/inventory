import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../../features/products/productSlice';
import { resetProductState } from '../../features/products/productSlice'; // Assuming reset state is needed for modal

const PurchaseFormModal = ({ isOpen, onClose, onSubmit, purchase, isEditing, suppliers, products }) => {
    const dispatch = useDispatch();
    const { token } = useSelector((state) => state.auth);
    const { status, error } = useSelector((state) => state.purchases);

    const [formData, setFormData] = useState({
        supplierId: purchase?.supplierId?._id || purchase?.supplierId || '',
        purchaseDate: purchase?.purchaseDate ? new Date(purchase.purchaseDate).toISOString().split('T')[0] : '',
        taxAmount: purchase?.taxAmount || 0,
        discount: purchase?.discount || 0,
        paymentStatus: purchase?.paymentStatus || 'PENDING',
        notes: purchase?.notes || '',
        // Products will be handled separately for creation, possibly with a multi-select or similar
        // For editing, we might only allow metadata changes.
        products: purchase?.products || [], // Use purchase.products if editing
    });

    useEffect(() => {
        // Fetch suppliers and products if they are not already loaded
        if (!suppliers || suppliers.length === 0) {
            dispatch(fetchSuppliers({ token, params: { limit: 1000 } }));
        }
        if (!products || products.length === 0) {
            dispatch(fetchProducts({ token, params: { limit: 1000 } }));
        }
    }, [dispatch, token, suppliers, products]);

    // Effect to reset form when modal opens or when purchase prop changes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                supplierId: purchase?.supplierId?._id || purchase?.supplierId || '',
                purchaseDate: purchase?.purchaseDate ? new Date(purchase.purchaseDate).toISOString().split('T')[0] : '',
                taxAmount: purchase?.taxAmount || 0,
                discount: purchase?.discount || 0,
                paymentStatus: purchase?.paymentStatus || 'PENDING',
                notes: purchase?.notes || '',
                products: purchase?.products || [], // If editing, pre-fill products
            });
        } else {
            // Reset form for new purchase or when modal closes
            setFormData({
                supplierId: '',
                purchaseDate: '',
                taxAmount: 0,
                discount: 0,
                paymentStatus: 'PENDING',
                notes: '',
                products: [],
            });
        }
    }, [isOpen, purchase]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData({ ...formData, [name]: type === 'number' ? parseFloat(value) : value });
    };

    const handleProductChange = (productId, field, value) => {
        setFormData(prev => {
            const newProducts = prev.products.map(item => {
                if (item.productId === productId) {
                    let updatedItem = { ...item, [field]: type === 'number' ? parseFloat(value) : value };
                    // Recalculate totalPrice if quantity or price changes
                    if (field === 'quantity' || field === 'purchasePrice') {
                        updatedItem.totalPrice = updatedItem.quantity * updatedItem.purchasePrice;
                    }
                    return updatedItem;
                }
                return item;
            });
            return { ...prev, products: newProducts };
        });
    };

    const handleRemoveProduct = (productId) => {
        setFormData(prev => ({ ...prev, products: prev.products.filter(item => item.productId !== productId) }));
    };

    // Calculate totals based on form data
    const subtotal = formData.products.reduce((sum, item) => sum + item.totalPrice, 0);
    const calculatedFinalAmount = subtotal + formData.taxAmount - formData.discount;

    const handleFormSubmit = (e) => {
        e.preventDefault();
        // If creating, ensure products are correctly formatted with required fields
        const finalFormData = { ...formData };
        if (!isEditing) {
            // For new purchase, ensure products have all necessary fields (productId, quantity, purchasePrice, totalPrice)
            // The frontend ensures these are present via form inputs.
        }
        onSubmit(finalFormData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Purchase' : 'Add New Purchase'}>
            <form onSubmit={handleFormSubmit} className="space-y-4 p-4 md:p-6">
                <div>
                    <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700">Supplier</label>
                    <select
                        id="supplierId"
                        name="supplierId"
                        value={formData.supplierId}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="">Select a Supplier</option>
                        {suppliers?.map(sup => (
                            <option key={sup._id} value={sup._id}>{sup.name}</option>
                        ))}
                    </select>
                </div>
                <FormInput label="Purchase Date" name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} required />
                <FormInput label="Tax Amount" name="taxAmount" type="number" value={formData.taxAmount} onChange={handleChange} min="0" step="0.01" />
                <FormInput label="Discount" name="discount" type="number" value={formData.discount} onChange={handleChange} min="0" step="0.01" />
                <FormInput label="Notes" name="notes" value={formData.notes} onChange={handleChange} isTextArea />

                {/* Product Items - This part needs a more robust UI for adding/managing products in a purchase */}
                {!isEditing && (
                    <div className="mt-6">
                        <h3 className="text-lg font-medium text-gray-700">Products</h3>
                        <div className="border rounded-md p-3">
                            {formData.products.length === 0 ? (
                                <p className="text-center text-gray-500">Add products to your purchase.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {formData.products.map(item => (
                                        <li key={item.productId} className="flex justify-between items-center p-3 border-b last:border-b-0">
                                            <div>
                                                <p className="font-medium">{item.name || item.productId} </p>
                                                <p className="text-sm text-gray-600">Qty: {item.quantity} @ ${item.sellingPrice.toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleProductChange(item.productId, 'quantity', e.target.value)}
                                                    className="w-16 text-center border border-gray-300 rounded-md p-1"
                                                />
                                                <span>= ${item.totalPrice.toFixed(2)}</span>
                                                <button onClick={() => handleRemoveProduct(item.productId)} className="text-red-500 hover:text-red-700">X</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {/* Dropdown to add products would go here */}
                    </div>
                )}

                {/* Totals Summary */}
                <div className="mt-6 border-t pt-4">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Subtotal:</span>
                        <span className="font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Tax ({ (taxAmount / (subtotal || 1) * 100).toFixed(1)}%):</span>
                        <span className="font-semibold">${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-4">
                        <span className="text-gray-700">Discount:</span>
                        <span className="font-semibold">-${formData.discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-4">
                        <span className="text-xl font-bold text-gray-900">Total:</span>
                        <span className="text-xl font-bold text-indigo-600">${calculatedFinalAmount.toFixed(2)}</span>
                    </div>
                </div>

                {status === 'failed' && error && (
                    <div className="text-sm text-red-600 text-center">
                        {error}
                    </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none">Cancel</button>
                    <button
                        type="submit"
                        disabled={status === 'loading' || formData.products.length === 0}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === 'loading' ? (isEditing ? 'Updating...' : 'Saving Purchase...') : (isEditing ? 'Update Purchase' : 'Create Purchase')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default PurchaseFormModal;
