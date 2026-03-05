import React from 'react';
import { Link } from 'react-router-dom';

const FormInput = ({ label, name, type = 'text', value, onChange, required = false, min, step, isTextArea = false }) => {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="mt-1">
                {isTextArea ? (
                    <textarea
                        id={name}
                        name={name}
                        value={value}
                        onChange={onChange}
                        required={required}
                        rows="3"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                ) : (
                    <input
                        id={name}
                        name={name}
                        type={type}
                        value={value}
                        onChange={onChange}
                        required={required}
                        min={min}
                        step={step}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                )}
            </div>
        </div>
    );
};

export default FormInput;
