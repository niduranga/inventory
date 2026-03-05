import React from 'react';
import Sidebar from './Sidebar'; // Sidebar is likely in the same directory as MainLayout
import Header from './Header';   // Header is likely in the same directory as MainLayout

const MainLayout = ({ children }) => {
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
