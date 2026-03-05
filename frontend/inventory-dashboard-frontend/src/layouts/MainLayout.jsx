import React from 'react';
import Sidebar from './Sidebar'; // Corrected import path
import Header from './Header';   // Corrected import path

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
