import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import productReducer from '../features/products/productSlice';
import categoryReducer from '../features/categories/categorySlice';
import supplierReducer from '../features/suppliers/supplierSlice';
import userReducer from '../features/users/userSlice';
import inventoryReducer from '../features/inventory/inventorySlice';
import salesReducer from '../features/sales/saleSlice';
import purchaseReducer from '../features/purchases/purchaseSlice';
import reportReducer from '../features/reports/reportSlice';
import notificationReducer from '../features/notifications/notificationSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        products: productReducer,
        categories: categoryReducer,
        suppliers: supplierReducer,
        users: userReducer,
        inventory: inventoryReducer,
        sales: salesReducer,
        purchases: purchaseReducer,
        reports: reportReducer,
        notifications: notificationReducer,
    },
});