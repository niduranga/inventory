import React from 'react';

const SearchFilterBar = ({ currentFilters, onFilterChange, additionalFilters = [] }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ [name]: value });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        onFilterChange({ search: e.target.search.value });
    };

    return (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow-md">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex-grow flex items-center">
                <input
                    type="text"
                    name="search"
                    placeholder="Search by name or SKU..."
                    defaultValue={currentFilters.search}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none">
                    Search
                </button>
            </form>

            {/* Additional Filters (e.g., category, supplier, status) */}
            {additionalFilters.map(filter => (
                <div key={filter.id} className="flex-shrink-0">
                    <label htmlFor={filter.id} className="sr-only">{filter.label}</label>
                    {filter.type === 'select' ? (
                        <select
                            id={filter.id}
                            name={filter.id}
                            value={currentFilters[filter.id] || ''}
                            onChange={handleChange}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            {filter.options.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type={filter.type}
                            id={filter.id}
                            name={filter.id}
                            placeholder={filter.label}
                            value={currentFilters[filter.id] || ''}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    )}
                </div>
            ))}
        </div>
    );
};

export default SearchFilterBar;
