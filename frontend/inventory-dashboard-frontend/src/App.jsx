import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import Spinner from './components/common/Spinner';

// Lazy load pages
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));

// Product Routes
const ProductsPage = lazy(() => import('./pages/products/ProductsPage'));
const ProductDetailsPage = lazy(() => import('./pages/products/ProductDetailsPage'));

// Category Routes
const CategoriesPage = lazy(() => import('./pages/categories/CategoriesPage'));

// Supplier Routes
const SuppliersPage = lazy(() => import('./pages/suppliers/SuppliersPage'));

// User Routes
const UsersPage = lazy(() => import('./pages/users/UsersPage'));

// Sales Routes
const SalesPage = lazy(() => import('./pages/sales/SalesPage'));
const SaleDetailsPage = lazy(() => import('./pages/sales/SalesDetailsPage'));
const POSPage = lazy(() => import('./pages/sales/POSPage')); // For new sale creation

// Purchase Routes
const PurchasesPage = lazy(() => import('./pages/purchases/PurchasesPage'));
const PurchaseDetailsPage = lazy(() => import('./pages/purchases/PurchaseDetailsPage'));

// Inventory Routes
const InventoryPage = lazy(() => import('./pages/inventory/InventoryPage'));

// Report Routes
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));

// Notification Routes
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));

// Auth Routes
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

function App() {
    const { token, user } = useSelector((state) => state.auth);

    const PrivateRoute = ({ children }) => {
        return token ? children : <Navigate to="/login" />;
    };

    const RoleBasedRoute = ({ children, allowedRoles }) => {
        const userRole = user?.role;
        if (!token) {
            return <Navigate to="/login" />;
        }
        if (!allowedRoles.includes(userRole)) {
            return <Navigate to="/dashboard" />;
        }
        return children;
    };

    return (
        <Router>
            <Suspense fallback={<Spinner />}>
                <Routes>
                    {/* Auth Routes */}
                    <Route path="/login" element={<><AuthLayout /><LoginPage /></Route>}
                    <Route path="/register" element={<><AuthLayout /><RegisterPage /></Route>}

                    {/* Protected Routes with Main Layout */}
                    <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="products" element={<ProductsPage />} />
                        <Route path="products/:id" element={<ProductDetailsPage />} />
                        <Route path="categories" element={<CategoriesPage />} />
                        <Route path="suppliers" element={<SuppliersPage />} />
                        <Route path="users" element={<UsersPage />} />
                        <Route path="sales" element={<SalesPage />} />
                        <Route path="sales/:id" element={<SaleDetailsPage />} />
                        <Route path="sales/pos" element={<POSPage />} /> 
                        <Route path="purchases" element={<PurchasesPage />} />
                        <Route path="purchases/:id" element={<PurchaseDetailsPage />} />
                        <Route path="inventory" element={<InventoryPage />} />
                        <Route path="reports" element={<ReportsPage />} />
                        <Route path="notifications" element={<NotificationsPage />} />
                        {/* Redirect to dashboard if no other route matches */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Route>
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;
