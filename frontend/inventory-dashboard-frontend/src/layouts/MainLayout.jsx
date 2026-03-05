import React from 'react';
import Sidebar from './Sidebar'; // Assuming Sidebar is in the same directory
import Header from './Header';   // Assuming Header is in the same directory

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
