import { Link, useLocation } from 'react-router-dom'
import { FaAngleLeft } from 'react-icons/fa'

const LABELS: Record<string, string> = {
    // جذور
    '/admin': 'لوحة الإدارة',
    '/teacher': 'لوحة المعلّم',
    '/student': 'لوحة الطالب',
    '/parent': 'لوحة وليّ الأمر',
    '/employee': 'لوحة الموظّف',

    // Admin
    '/admin/institutes': 'المعاهد',
    '/admin/employees': 'الموظفون',
    '/admin/circles': 'الحلقات',
    '/admin/students': 'الطلاب',
    '/admin/parents': 'أولياء الأمور',
    '/admin/notifications': 'الإشعارات',

    // Teacher
    '/teacher/circles': 'حلقاتي',
    '/teacher/attendance': 'الحضور والغياب',
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
