import React from 'react';

const Alert = ({ message, type = 'info' }) => {
    const alertClasses = {
        info: 'bg-blue-100 border-blue-400 text-blue-700',
        success: 'bg-green-100 border-green-400 text-green-700',
        warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
        error: 'bg-red-100 border-red-400 text-red-700',
    };

    return (
        <div className={`border px-4 py-3 rounded relative ${alertClasses[type]} mb-4`} role="alert">
            <strong className="font-bold">{type.charAt(0).toUpperCase() + type.slice(1)}!</strong>
            <span className="block sm:inline ml-2">{message}</span>
        </div>
    );
};

export default Alert;
