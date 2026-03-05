import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProductsPage from './pages/products/ProductsPage';
import ProductFormPage from './pages/products/ProductFormPage'; // For create/edit
import ProductDetailsPage from './pages/products/ProductDetailsPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import CategoryFormPage from './pages/categories/CategoryFormPage';
import SuppliersPage from './pages/suppliers/SuppliersPage';
import SupplierFormPage from './pages/suppliers/SupplierFormPage';
import UsersPage from './pages/users/UsersPage';
import UserFormPage from './pages/users/UserFormPage';
import InventoryPage from './pages/inventory/InventoryPage'; // For history
import SalesPage from './pages/sales/SalesPage';
import SaleFormPage from './pages/sales/SaleFormPage'; // POS page
import PurchaseDetailsPage from './pages/purchases/PurchaseDetailsPage';
import SalesDetailsPage from './pages/sales/SalesDetailsPage';
import PurchasesPage from './pages/purchases/PurchasesPage';
import PurchaseFormPage from './pages/purchases/PurchaseFormPage';
import ReportsPage from './pages/reports/ReportsPage'; // Main reports page, might route to specific reports
import NotificationsPage from './pages/notifications/NotificationsPage';

// Authentication and Role-Based Routing
import { fetchUserProfile } from './features/auth/authSlice';

// --- Protected Route Component ---
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, status } = useSelector((state) => state.auth);

    if (status === 'loading') {
        return <div>Loading...</div>; // Or a proper spinner component
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace state={{ message: 'Access Denied: Insufficient permissions.' }} />;
    }

    return children;
};

// --- Main App Component ---
function App() {
    const dispatch = useDispatch();
    const { token, isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (token && !isAuthenticated) {
            dispatch(fetchUserProfile());
        }
    }, [token, isAuthenticated, dispatch]);

    return (
        <Router>
            <Routes>
                {/* Authentication Routes */}
                <Route element={<AuthLayout />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                </Route>

                {/* Main Application Layout (Protected Routes) */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute allowedRoles={['owner', 'manager', 'staff', 'superadmin']}>
                            <MainLayout />
                        </ProtectedRoute>
                    }
                >
                    {/* Dashboard - Default route within MainLayout */}
                    <Route index element={<DashboardPage />} />
                    <Route path="dashboard" element={<DashboardPage />} />

                    {/* Products Management */}
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="products/new" element={<ProtectedRoute allowedRoles={['owner', 'manager']}><ProductFormPage /></ProtectedRoute>} />
                    <Route path="products/:id/edit" element={<ProtectedRoute allowedRoles={['owner', 'manager']}><ProductFormPage /></ProtectedRoute>} />
                    <Route path="products/:id" element={<ProductDetailsPage />} />

                    {/* Categories Management */}
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route path="categories/new" element={<ProtectedRoute allowedRoles={['owner', 'manager']}><CategoryFormPage /></ProtectedRoute>} />
                    <Route path="categories/:id/edit" element={<ProtectedRoute allowedRoles={['owner', 'manager']}><CategoryFormPage /></ProtectedRoute>} />

                    {/* Suppliers Management */}
                    <Route path="suppliers" element={<SuppliersPage />} />
                    <Route path="suppliers/new" element={<ProtectedRoute allowedRoles={['owner', 'manager']}><SupplierFormPage /></ProtectedRoute>} />
                    <Route path="suppliers/:id/edit" element={<ProtectedRoute allowedRoles={['owner', 'manager']}><SupplierFormPage /></ProtectedRoute>} />

                    {/* Users Management */}
                    <Route path="users" element={<ProtectedRoute allowedRoles={['owner', 'manager', 'superadmin']}><UsersPage /></ProtectedRoute>} />
                    <Route path="users/invite" element={<ProtectedRoute allowedRoles={['owner', 'manager', 'superadmin']}><UserFormPage /></ProtectedRoute>} />
                    <Route path="users/:id/edit" element={<ProtectedRoute allowedRoles={['owner', 'manager', 'superadmin']}><UserFormPage /></ProtectedRoute>} />

                    {/* Inventory Management */}
                    <Route path="inventory" element={<InventoryPage />} />

                    {/* Sales / POS */}
                    <Route path="sales" element={<SalesPage />} />
                    <Route path="sales/pos" element={<ProtectedRoute allowedRoles={['staff', 'owner', 'manager']}><SaleFormPage /></ProtectedRoute>} />
                    <Route path="sales/:id" element={<SalesDetailsPage />} />

                    {/* Purchases */}
                    <Route path="purchases" element={<PurchasesPage />} />
                    <Route path="purchases/new" element={<ProtectedRoute allowedRoles={['owner', 'manager']}><PurchaseFormPage /></ProtectedRoute>} />
                    <Route path="purchases/:id" element={<PurchaseDetailsPage />} />

                    {/* Reports */}
                    <Route path="reports" element={<ProtectedRoute allowedRoles={['owner', 'manager', 'superadmin']}><ReportsPage /></ProtectedRoute>} />

                    {/* Notifications */}
                    <Route path="notifications" element={<NotificationsPage />} />

                    {/* Fallback for unmatched routes within MainLayout */}
                    <Route path="*" element={<p className="p-4 text-xl font-semibold">404 - Page Not Found</p>} />
                </Route>

                {/* Catch-all route for any unmatched routes, redirect to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
