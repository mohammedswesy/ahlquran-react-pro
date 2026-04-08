import React, { useState, useEffect } from 'react';
import { Head, router, useRoute } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { unwrapApiResponse, enrollmentAPI } from '@/Services/api';
import LoadingSpinner from '@/Components/LoadingSpinner';
import { useNotification } from '@/Context/NotificationContext';

export default function EnrollmentsList() {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        payment_status: '',
        search: '',
        per_page: 15,
    });
    const [pagination, setPagination] = useState(null);
    const { success: showSuccess, error: showError } = useNotification();

    useEffect(() => {
        loadEnrollments();
    }, [filters]);

    const loadEnrollments = async () => {
        try {
            setLoading(true);
            const response = await enrollmentAPI.list(filters);
            const data = unwrapApiResponse(response);
            setEnrollments(data || []);
            if (response?.meta) {
                setPagination(response.meta);
            }
        } catch (err) {
            showError('Failed to load enrollments');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (enrollmentId, newStatus) => {
        if (!window.confirm(`Change status to ${newStatus}?`)) return;

        try {
            await enrollmentAPI.changeStatus(enrollmentId, {
                status: newStatus,
            });
            showSuccess('Enrollment status updated');
            loadEnrollments();
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleDelete = async (enrollmentId) => {
        if (!window.confirm('Are you sure you want to delete this enrollment?')) return;

        try {
            await enrollmentAPI.delete(enrollmentId);
            showSuccess('Enrollment deleted');
            loadEnrollments();
        } catch (err) {
            showError('Failed to delete enrollment');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            active: 'bg-green-100 text-green-800',
            suspended: 'bg-red-100 text-red-800',
            completed: 'bg-blue-100 text-blue-800',
            cancelled: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getPaymentBadge = (status) => {
        const colors = {
            paid: 'bg-green-100 text-green-800',
            partial: 'bg-orange-100 text-orange-800',
            unpaid: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading && enrollments.length === 0) {
        return (
            <AuthenticatedLayout>
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Enrollment Management</h2>}
        >
            <Head title="Enrollments" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Filters */}
                    <div className="mb-6 bg-white rounded-lg shadow p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <input
                                type="text"
                                placeholder="Search by student name..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="px-4 py-2 border rounded-lg"
                            />
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="px-4 py-2 border rounded-lg"
                            >
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <select
                                value={filters.payment_status}
                                onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}
                                className="px-4 py-2 border rounded-lg"
                            >
                                <option value="">All Payments</option>
                                <option value="paid">Paid</option>
                                <option value="partial">Partial</option>
                                <option value="unpaid">Unpaid</option>
                            </select>
                            <button
                                onClick={() => router.visit(route('enrollments.create'))}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                New Enrollment
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Institute</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fees</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {enrollments.map((enrollment) => (
                                    <tr key={enrollment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {enrollment.student?.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {enrollment.institute?.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(enrollment.status)}`}>
                                                {enrollment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentBadge(enrollment.payment_status)}`}>
                                                {enrollment.payment_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <div>
                                                <div>AED {parseFloat(enrollment.total_fees || 0).toFixed(2)}</div>
                                                <div className="text-xs text-gray-500">Paid: AED {parseFloat(enrollment.paid_amount || 0).toFixed(2)}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {new Date(enrollment.enrollment_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                            <button
                                                onClick={() => router.visit(route('enrollments.edit', enrollment.id))}
                                                className="text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(enrollment.id)}
                                                className="text-red-600 hover:text-red-700 font-medium"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {enrollments.length === 0 && !loading && (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No enrollments found</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination && (
                        <div className="mt-6 flex justify-between items-center">
                            <p className="text-sm text-gray-600">
                                Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
                                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                                {pagination.total} results
                            </p>
                            <div className="space-x-2">
                                {pagination.current_page > 1 && (
                                    <button
                                        onClick={() => setFilters({ ...filters, page: pagination.current_page - 1 })}
                                        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                    >
                                        Previous
                                    </button>
                                )}
                                {pagination.current_page < pagination.last_page && (
                                    <button
                                        onClick={() => setFilters({ ...filters, page: pagination.current_page + 1 })}
                                        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                    >
                                        Next
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
