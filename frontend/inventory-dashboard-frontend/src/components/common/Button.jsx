import React from 'react';

const Button = ({ onClick, children, className, disabled = false }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-150 ${className} ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'}`}
        >
            {children}
        </button>
    );
};

export default Button;
