import { Link, useLocation } from 'react-router-dom'
import { FaAngleLeft } from 'react-icons/fa'

const LABELS: Record<string, string> = {
    // جذور
    '/admin': 'لوحة الإدارة',
    '/admin/dashboard': 'لوحة القيادة التنفيذية',
    '/teacher': 'لوحة المعلّم',
    '/teacher/dashboard': 'لوحة المعلّم',
    '/student': 'لوحة الطالب',
    '/parent': 'لوحة وليّ الأمر',
    '/employee': 'لوحة الموظّف',
    '/employee/dashboard': 'لوحة الموظّف',
    '/institute/dashboard': 'لوحة الشؤون التعليمية',
    '/dashboard/memorization': 'الحفظ والمراجعة',
    '/admin/memorization-reports': 'الحفظ والمراجعة',
    '/admin/attendance/take': 'سجل الحضور',
    '/admin/attendance/logs': 'سجل الحضور السابق',
    '/admin/attendance-sheet': 'سجل الحضور',
    '/admin/attendance-reports': 'الحضور والغياب',
    '/dashboard/attendance': 'الحضور والغياب',
    '/dashboard/evaluations': 'الاختبارات والتقييمات',
    '/admin/exam-reports': 'الاختبارات والتقييمات',
    '/dashboard/staff-monitoring': 'مواظبة الموظفين',
    '/admin/staff-attendance-reports': 'مواظبة الموظفين',

    // Admin
    '/admin/institutes': 'المعاهد',
    '/admin/employees': 'الموظفون',
    '/admin/employee-management': 'إدارة الموظفين',
    '/admin/payroll-management': 'الرواتب',
    '/admin/teachers': 'إدارة المعلمين',
    '/admin/circles': 'الحلقات',
    '/admin/students': 'الطلاب',
    '/admin/parents': 'أولياء الأمور',
    '/admin/notifications': 'الإشعارات',

    // Teacher
    '/teacher/circles': 'حلقاتي',
    '/teacher/attendance': 'الحضور والغياب',
    '/teacher/attendance/take': 'سجل الحضور',
    '/teacher/attendance-sheet': 'سجل الحضور',
    '/teacher/assessments': 'الاختبارات',

    // Student
    '/student/progress': 'تقدّمي',
    '/student/schedule': 'جدولي',

    // Parent
    '/parent/children': 'أبنائي',
    '/parent/reports': 'التقارير والشهادات',

    // Employee
    '/employee/tasks': 'مهامي',
    '/employee/people': 'دليل الأشخاص',
}

export default function Breadcrumbs() {
    const { pathname } = useLocation()

    // نبني أجزاء المسار تدريجياً: /admin /admin/employees /admin/employees/123
    const parts = pathname.split('/').filter(Boolean)
    const acc: { path: string; label: string }[] = []

    parts.reduce((prev, cur) => {
        const p = `${prev}/${cur}`
        // اختَر أقرب عنوان معروف، وإلاّ استخدم الجزء نفسه
        const label = LABELS[p] ?? cur
        acc.push({ path: p, label })
        return p
    }, '')

    if (acc.length === 0) return null

    return (
        <nav dir="rtl" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            {acc.map((item, i) => {
                const isLast = i === acc.length - 1
                return (
                    <span key={item.path} className="flex items-center gap-2">
                        {isLast ? (
                            <span className="font-semibold text-gray-800">{item.label}</span>
                        ) : (
                            <Link to={item.path} className="hover:text-[#0f5f5c]">
                                {item.label}
                            </Link>
                        )}
                        {!isLast && <FaAngleLeft className="opacity-70" />}
                    </span>
                )
            })}
        </nav>
    )
}
