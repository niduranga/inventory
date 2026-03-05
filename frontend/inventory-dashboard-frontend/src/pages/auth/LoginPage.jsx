import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearAuthError } from '../../features/auth/authSlice';
import { useState, useEffect } from 'react';

const LoginPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { status, error, isAuthenticated } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    // Clear error on component unmount or when changing form fields
    useEffect(() => {
        return () => {
            dispatch(clearAuthError());
        };
    }, [dispatch]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) {
            dispatch(clearAuthError()); // Clear error when user starts typing again
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const resultAction = await dispatch(login(formData));
        if (login.fulfilled.match(resultAction)) {
            // Login successful, handled by useEffect for redirection
        } else {
            // Error handled by Redux state, displayed below
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md mx-auto">
            <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">Sign in to your account</h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                    <div className="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                {status === 'failed' && error && (
                    <div className="text-sm text-red-600 text-center">
                        {error}
                    </div>
                )}

                <div>
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {status === 'loading' ? 'Signing in...' : 'Sign in'}
                    </button>
                </div>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Register here
                </Link>
            </p>
        </div>
    );
};

export default LoginPage;
