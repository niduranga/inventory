import React from 'react';
import { Menu, Transition } from '@headlessui/react'; // You might need to install @headlessui/react
import { Fragment } from 'react';
import { BellIcon, ChevronDownIcon } from '@heroicons/react/24/outline'; // You might need to install @heroicons/react
import { useNavigate } from 'react-router-dom';

// Header component
const Header = ({ user, onLogout }) => {
    const navigate = useNavigate();

    return (
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10">
            <div className="flex items-center">
                <button className="text-gray-500 focus:outline-none focus:text-gray-900 lg:hidden">
                    {/* Mobile sidebar toggle button */}
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                {/* Search bar can go here */}
                <h1 className="text-xl font-semibold text-gray-900 ml-4 hidden md:block">Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
                {/* Notifications Icon */}
                <button onClick={() => navigate('/notifications')} className="relative p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                    {/* Example: Dynamic badge for unread notifications */}
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">3</span>
                </button>

                {/* User Profile Dropdown */}
                <Menu as="div" className="relative ml-3">
                    <div>
                        <Menu.Button className="max-w-xs bg-gray-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                            <span className="sr-only">Open user menu</span>
                            <img
                                className="h-8 w-8 rounded-full"
                                src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random&color=fff`}
                                alt="User Avatar"
                            />
                             <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">{user?.name || 'Guest'}</span>
                             <ChevronDownIcon className="h-5 w-5 text-gray-400 ml-1 hidden md:block" aria-hidden="true" />
                        </Menu.Button>
                    </div>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={() => {
                                            // navigate to profile page
                                        }}
                                        className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                                    >
                                        Your Profile
                                    </button>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={() => {
                                            // navigate to settings page
                                        }}
                                        className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                                    >
                                        Settings
                                    </button>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={onLogout}
                                        className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                                    >
                                        Sign out
                                    </button>
                                )}
                            </Menu.Item>
                        </Menu.Items>
                    </Transition>
                </Menu>
            </div>
        </header>
    );
};

export default Header;
