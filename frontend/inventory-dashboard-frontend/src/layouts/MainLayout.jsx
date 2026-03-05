import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // Assuming Sidebar is in the same directory

const MainLayout = ({ children }) => {
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
