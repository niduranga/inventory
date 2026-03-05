import React from 'react';

const DataTable = ({ columns, data, pagination, onPageChange, onLimitChange }) => {
    const { currentPage, limit, totalDocs, totalPages } = pagination;

    const handlePrevPage = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const handleLimitChange = (e) => {
        onLimitChange(parseInt(e.target.value));
    };

    if (!data || data.length === 0) {
        return <p>No data to display.</p>;
    }

    return (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map((column, index) => (
                            <th
                                key={index}
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {columns.map((column, colIndex) => (
                                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {column.cell ? column.cell(row) : (column.format ? column.format(row[column.accessor]) : row[column.accessor])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                    <label htmlFor="items-per-page" className="text-sm text-gray-700">Items per page:</label>
                    <select
                        id="items-per-page"
                        value={limit}
                        onChange={handleLimitChange}
                        className="block w-full pl-3 pr-8 py-1 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        {[5, 10, 20, 50].map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <span>Showing {Math.min(totalDocs, (currentPage - 1) * limit + 1)} to {Math.min(totalDocs, currentPage * limit)} of {totalDocs} results</span>
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataTable;
