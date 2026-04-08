import React, { useState, useEffect } from 'react';
import { Head, router, useRoute } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { unwrapApiResponse, enrollmentAPI, studentAPI, instituteAPI, circleAPI } from '@/Services/api';
import FormBuilder from '@/Components/FormBuilder';
import LoadingSpinner from '@/Components/LoadingSpinner';
import { useNotification } from '@/Context/NotificationContext';

export default function EnrollmentForm() {
    const route = useRoute();
    const enrollmentId = route.params.id;
    const isEditing = !!enrollmentId;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditing);
    const [initialValues, setInitialValues] = useState({});
    const [students, setStudents] = useState([]);
    const [institutes, setInstitutes] = useState([]);
    const [circles, setCircles] = useState([]);
    const [selectedInstituteId, setSelectedInstituteId] = useState(null);
    const { success: showSuccess, error: showError } = useNotification();

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load students and institutes
                const [studentsRes, institutesRes] = await Promise.all([
                    studentAPI.list(),
                    instituteAPI.list(),
                ]);
                setStudents(unwrapApiResponse(studentsRes) || []);
                setInstitutes(unwrapApiResponse(institutesRes) || []);

                if (isEditing) {
                    const enrollmentRes = await enrollmentAPI.get(enrollmentId);
                    const enrollment = unwrapApiResponse(enrollmentRes) || {};
                    setInitialValues(enrollment);
                    setSelectedInstituteId(enrollment.institute_id);

                    // Load circles for the institute
                    if (enrollment.institute_id) {
                        const circlesRes = await circleAPI.list();
                        setCircles(unwrapApiResponse(circlesRes) || []);
                    }
                }
            } catch (err) {
                showError('Failed to load form data');
            } finally {
                setInitialLoading(false);
            }
        };

        loadData();
    }, []);

    // Load circles when institute changes
    useEffect(() => {
        const loadCircles = async () => {
            if (selectedInstituteId) {
                try {
                    const circlesRes = await circleAPI.list();
                    const filteredCircles = unwrapApiResponse(circlesRes)?.filter(
                        (c) => c.institute_id === selectedInstituteId
                    ) || [];
                    setCircles(filteredCircles);
                } catch (err) {
                    console.error('Failed to load circles:', err);
                    setCircles([]);
                }
            }
        };

        loadCircles();
    }, [selectedInstituteId]);

    const fields = [
        {
            name: 'student_id',
            label: 'Student',
            type: 'select',
            required: true,
            options: students.map((s) => ({ value: s.id, label: s.name })),
        },
        {
            name: 'institute_id',
            label: 'Institute',
            type: 'select',
            required: true,
            options: institutes.map((i) => ({ value: i.id, label: i.name })),
            onChangeCallback: setSelectedInstituteId,
        },
        {
            name: 'circle_id',
            label: 'Circle',
            type: 'select',
            options: circles.map((c) => ({ value: c.id, label: c.name })),
        },
        {
            name: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            options: [
                { value: 'pending', label: 'Pending' },
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
            ],
        },
        {
            name: 'enrollment_date',
            label: 'Enrollment Date',
            type: 'date',
            required: true,
        },
        {
            name: 'start_date',
            label: 'Start Date',
            type: 'date',
        },
        {
            name: 'end_date',
            label: 'End Date',
            type: 'date',
        },
        {
            name: 'total_fees',
            label: 'Total Fees',
            type: 'number',
            required: true,
            placeholder: '0.00',
        },
        {
            name: 'enrollment_code',
            label: 'Enrollment Code',
            type: 'text',
        },
        {
            name: 'notes',
            label: 'Notes',
            type: 'textarea',
            rows: 3,
        },
    ];

    const handleSubmit = async (formData) => {
        try {
            setLoading(true);
            if (isEditing) {
                await enrollmentAPI.update(enrollmentId, formData);
                showSuccess('Enrollment updated successfully');
            } else {
                await enrollmentAPI.create(formData);
                showSuccess('Enrollment created successfully');
            }
            router.visit(route('enrollments.index'));
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to save enrollment');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
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
            header={<h2 className="text-xl font-semibold">{isEditing ? 'Edit Enrollment' : 'New Enrollment'}</h2>}
        >
            <Head title={isEditing ? 'Edit Enrollment' : 'New Enrollment'} />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-6">
                            <FormBuilder
                                fields={fields}
                                initialValues={initialValues}
                                onSubmit={handleSubmit}
                                loading={loading}
                                submitText={isEditing ? 'Update' : 'Create'}
                                onCancel={() => router.visit(route('enrollments.index'))}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
