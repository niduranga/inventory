import React from 'react';

const Spinner = () => {
    return (
        <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
};

export default Spinner;
