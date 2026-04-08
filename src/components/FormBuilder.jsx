import React, { useState, useEffect } from 'react';

const FormBuilder = ({ fields, onSubmit, loading = false, submitText = 'Submit', cancelText = 'Cancel', onCancel, initialValues = {} }) => {
    const [formData, setFormData] = useState(() => {
        const initial = {};
        fields.forEach(field => {
            initial[field.name] = field.defaultValue ?? '';
        });
        return { ...initial, ...initialValues };
    });

    useEffect(() => {
        if (initialValues && Object.keys(initialValues).length > 0) {
            setFormData(prev => ({ ...prev, ...initialValues }));
        }
    }, [initialValues]);

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        
        // Call custom onChange callback if provided
        const field = fields.find(f => f.name === name);
        if (field?.onChangeCallback) {
            field.onChangeCallback(type === 'checkbox' ? checked : value);
        }
        
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        // Validate required fields
        fields.forEach(field => {
            if (field.required && (!formData[field.name] || (Array.isArray(formData[field.name]) && formData[field.name].length === 0))) {
                newErrors[field.name] = `${field.label} is required`;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map(field => (
                <div key={field.name}>
                    {field.type !== 'checkbox' && (
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                        </label>
                    )}

                    {field.type === 'text' || field.type === 'email' || field.type === 'password' || field.type === 'number' || field.type === 'date' ? (
                        <input
                            type={field.type}
                            name={field.name}
                            value={formData[field.name]}
                            onChange={handleChange}
                            placeholder={field.placeholder}
                            disabled={loading || field.disabled}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
                                errors[field.name] ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                    ) : field.type === 'textarea' ? (
                        <textarea
                            name={field.name}
                            value={formData[field.name]}
                            onChange={handleChange}
                            placeholder={field.placeholder}
                            rows={field.rows || 4}
                            disabled={loading || field.disabled}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
                                errors[field.name] ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                    ) : field.type === 'select' ? (
                        <select
                            name={field.name}
                            value={formData[field.name]}
                            onChange={handleChange}
                            disabled={loading || field.disabled}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
                                errors[field.name] ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Select {field.label}</option>
                            {field.options?.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    ) : field.type === 'checkbox' ? (
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name={field.name}
                                checked={formData[field.name]}
                                onChange={handleChange}
                                disabled={loading || field.disabled}
                                className="h-4 w-4 text-blue-600 disabled:opacity-50"
                            />
                            <label className="ml-2 text-sm text-gray-700">{field.label}</label>
                        </div>
                    ) : null}

                    {errors[field.name] && (
                        <p className="mt-2 text-sm text-red-500">{errors[field.name]}</p>
                    )}
                </div>
            ))}

            <div className="flex gap-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Loading...' : submitText}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                )}
            </div>
        </form>
    );
};

export default FormBuilder;
