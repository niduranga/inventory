import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, TimeScale, LineElement, PointElement } from 'chart.js';
import 'chartjs-adapter-date-fns';

// Sidebar component
const Sidebar = () => {
    const { user } = useSelector((state) => state.auth);

    const userRole = user?.role;

    // Define navigation items with role-based access
    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: '📊', roles: ['superadmin', 'owner', 'manager', 'staff'] },
        { name: 'Products', path: '/products', icon: '📦', roles: ['superadmin', 'owner', 'manager', 'staff'] },
        { name: 'Categories', path: '/categories', icon: '🏷️', roles: ['superadmin', 'owner', 'manager', 'staff'] },
        { name: 'Suppliers', path: '/suppliers', icon: '🚚', roles: ['superadmin', 'owner', 'manager', 'staff'] },
        { name: 'Users', path: '/users', icon: '👤', roles: ['superadmin', 'owner', 'manager'] }, // Staff cannot manage users
        { name: 'Inventory', path: '/inventory', icon: '📋', roles: ['superadmin', 'owner', 'manager', 'staff'] },
        { name: 'Purchases', path: '/purchases', icon: '💰', roles: ['superadmin', 'owner', 'manager', 'staff'] },
        { name: 'Sales (POS)', path: '/sales/pos', icon: '🛒', roles: ['superadmin', 'owner', 'manager', 'staff'] }, // Staff can make sales
        { name: 'Sales History', path: '/sales', icon: '📈', roles: ['superadmin', 'owner', 'manager', 'staff'] },
        { name: 'Reports', path: '/reports', icon: '📈', roles: ['superadmin', 'owner', 'manager'] }, // Staff might have limited report access
        { name: 'Notifications', path: '/notifications', icon: '🔔', roles: ['superadmin', 'owner', 'manager', 'staff'] },
        // Add more items as needed
    ];

    return (
        <div className="w-64 bg-gray-800 text-white flex flex-col p-4 shadow-lg">
            <div className="text-2xl font-bold mb-6 text-center text-indigo-400">IMS Admin</div>
            <nav>
                {navItems.map((item) => {
                    // Only render if the user's role is allowed for this item
                    if (item.roles.includes(userRole)) {
                        return (
                            <Link key={item.name} to={item.path} className="flex items-center py-2.5 px-4 rounded-md text-sm font-medium hover:bg-gray-700 transition duration-150 ease-in-out mb-2">
                                <span className="mr-3 text-lg">{item.icon}</span>
                                {item.name}
                            </Link>
                        );
                    }
                    return null;
                })}
            </nav>
            <div className="mt-auto text-center text-gray-400 text-xs">
                Logged in as: {user?.name || 'Guest'} ({userRole})
            </div>
        </div>
    );
};

export default Sidebar; 