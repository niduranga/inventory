import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../auth/authSlice'; // Corrected path to authSlice

const Sidebar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const userRole = useSelector((state) => state.auth.user?.role);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const sidebarNav = [
        { name: 'Dashboard', path: '/dashboard', roles: ['superadmin', 'owner', 'manager', 'staff'] },
        { name: 'Products', path: '/products', roles: ['superadmin', 'owner', 'manager'] },
        { name: 'Categories', path: '/categories', roles: ['superadmin', 'owner', 'manager'] },
        { name: 'Suppliers', path: '/suppliers', roles: ['superadmin', 'owner', 'manager'] },
        { name: 'Users', path: '/users', roles: ['superadmin', 'owner'] },
        { name: 'Sales', path: '/sales', roles: ['owner', 'manager', 'staff'] },
        { name: 'Purchases', path: '/purchases', roles: ['owner', 'manager'] },
        { name: 'Inventory', path: '/inventory', roles: ['owner', 'manager', 'staff'] },
        { name: 'Reports', path: '/reports', roles: ['owner', 'manager'] },
        { name: 'Notifications', path: '/notifications', roles: ['owner', 'manager', 'staff'] },
    ];

    return (
        <aside className="w-64 bg-gray-800 text-white h-screen sticky top-0 overflow-y-auto transition-all duration-300">
            <div className="p-4 flex flex-col h-full justify-between">
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-center">Inventory Mgmt</h2>
                    <nav>
                        <ul>
                            {sidebarNav.map((item) => {
                                if (item.roles.includes(userRole)) {
                                    return (
                                        <li key={item.name} className="mb-2">
                                            <Link to={item.path} className="block py-2 px-4 rounded hover:bg-gray-700 transition duration-200">
                                                {item.name}
                                            </Link>
                                        </li>
                                    );
                                }
                                return null;
                            })}
                        </ul>
                    </nav>
                </div>
                <div className="mt-auto pt-4">
                    <button onClick={handleLogout} className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded-md transition duration-200">Logout</button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
