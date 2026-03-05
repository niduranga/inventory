import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearAuthError } from '../../features/auth/authSlice';

const RegisterPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { status, error } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    // Clear error on component unmount
    useEffect(() => {
        return () => {
            dispatch(clearAuthError());
        };
    }, [dispatch]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) {
            dispatch(clearAuthError());
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setRegistrationSuccess(false); // Reset success state

        // The backend `registerUser` function in authController.js allows roles, but default is 'staff'.
        // For frontend registration, we'll assume a default 'staff' role or let the backend assign it.
        // If we want to allow 'owner' registration, more specific UI/logic is needed.
        const registerData = { ...formData, role: 'staff' }; // Explicitly set default role for frontend registration

        const resultAction = await dispatch(register(registerData));
        if (register.fulfilled.match(resultAction)) {
            setRegistrationSuccess(true);
            // Optionally, clear form data after successful registration
            setFormData({ name: '', email: '', password: '' });
            // You might redirect to login page after a short delay
            // setTimeout(() => navigate('/login'), 2000);
        } else {
            // Error handled by Redux state, displayed below
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md mx-auto">
            <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">Create a new account</h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <div className="mt-1">
                        <input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

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
                            autoComplete="new-password"
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

                {registrationSuccess && (
                    <div className="text-sm text-green-600 text-center">
                        Registration successful! You can now{' '}
                        <Link to="/login" className="font-medium text-green-600 hover:text-green-500">log in</Link>.
                    </div>
                )}

                <div>
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {status === 'loading' ? 'Registering...' : 'Register'}
                    </button>
                </div>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Sign in here
                </Link>
            </p>
        </div>
    );
};

export default RegisterPage;
