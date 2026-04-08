import type { ElementType } from "react"
import {
    PiSquaresFourBold as LayoutDashboard,
    PiBuildingsBold as School,
    PiUsersThreeBold as Users,
    PiUserGearBold as UserCog,
    PiBookOpenTextBold as BookOpen,
    PiClipboardTextBold as ClipboardList,
    PiChartLineUpBold as LineChart,
    PiFileTextBold as FileText,
    PiBellRingingBold as Bell,
    PiGearSixBold as Settings,
    PiBooksBold as Library,
    PiIdentificationCardBold as IdCard,
    PiLaptopBold as Laptop,
} from "react-icons/pi"

export type Role =
    | "super-admin" | "org-admin" | "institute-admin" | "sub-admin"
    | "teacher" | "student" | "parent" | "employee"

export type MenuItem = {
    label: string
    to: string
    icon?: ElementType
}

export type MenuSection = {
    title?: string
    items: MenuItem[]
}

export function getMenuForRole(role: Role | null | undefined): MenuSection[] {
    const isSuperAdmin = role === "super-admin"
    const isInstituteAdmin = role === "institute-admin" || role === "sub-admin"
    const isOrgAdmin = role === "org-admin"

    if (isSuperAdmin) {
        return [
            {
                items: [{ label: "لوحة القيادة", to: "/admin", icon: LayoutDashboard }],
            },
            {
                title: "الإدارة العامة",
                items: [
                    { label: "المعاهد", to: "/admin/institutes", icon: School },
                    { label: "المنظمات", to: "/admin/organizations", icon: Users },
                    { label: "الإعدادات العامة", to: "/settings/system", icon: Settings },
                ],
            },
            {
                title: "التشغيل",
                items: [
                    { label: "التقارير", to: "/admin/reports", icon: FileText },
                    { label: "الإشعارات", to: "/admin/notifications", icon: Bell },
                    { label: "الموظفون", to: "/admin/employees", icon: UserCog },
                ],
            },
        ]
    }

    if (isInstituteAdmin) {
        return [
            {
                items: [{ label: "لوحة مدير المعهد", to: "/institute/dashboard", icon: LayoutDashboard }],
            },
            {
                title: "إدارة المعهد",
                items: [
                    { label: "المدرسين", to: "/admin/teachers", icon: UserCog },
                    { label: "الحلقات", to: "/admin/circles", icon: BookOpen },
                    { label: "الطلاب", to: "/admin/students", icon: Users },
                    { label: "التقارير", to: "/admin/reports", icon: FileText },
                ],
            },
            {
                title: "أخرى",
                items: [
                    { label: "الإشعارات", to: "/admin/notifications", icon: Bell },
                    { label: "المكتبة", to: "/admin/library", icon: Library },
                    { label: "إعدادات المعهد", to: "/settings/institute", icon: Settings },
                ],
            },
        ]
    }

    if (isOrgAdmin) {
        return [
            {
                items: [{ label: "لوحة القيادة", to: "/admin", icon: LayoutDashboard }],
            },
            {
                title: "الإدارة",
                items: [
                    { label: "الحلقات", to: "/admin/circles", icon: BookOpen },
                    { label: "الطلاب", to: "/admin/students", icon: Users },
                    { label: "المدرسين", to: "/admin/teachers", icon: UserCog },
                    { label: "التقارير", to: "/admin/reports", icon: FileText },
                ],
            },
            {
                title: "أخرى",
                items: [
                    { label: "الإشعارات", to: "/admin/notifications", icon: Bell },
                    { label: "المكتبة", to: "/admin/library", icon: Library },
                    { label: "الملف الشخصي", to: "/settings/profile", icon: Settings },
                ],
            },
        ]
    }

    if (role === "teacher") {
        return [
            { items: [{ label: "لوحة القيادة", to: "/teacher", icon: LayoutDashboard }] },
            {
                title: "أدوات المعلم",
                items: [
                    { label: "حلقاتي", to: "/teacher/circles", icon: BookOpen },
                    { label: "تسجيل الحضور", to: "/teacher/attendance", icon: ClipboardList },
                    { label: "التقييمات", to: "/teacher/assessments", icon: FileText },
                    { label: "الحفظ", to: "/teacher/memorization", icon: BookOpen },
                    { label: "المراجعات", to: "/teacher/reviews", icon: ClipboardList },
                ],
            },
        ]
    }

    if (role === "student") {
        return [
            { items: [{ label: "لوحة القيادة", to: "/student", icon: LayoutDashboard }] },
            {
                items: [
                    { label: "تقدّمي", to: "/student/progress", icon: LineChart },
                    { label: "جدولي", to: "/student/schedule", icon: ClipboardList },
                ],
            },
        ]
    }

    if (role === "parent") {
        return [
            { items: [{ label: "لوحة القيادة", to: "/parent", icon: LayoutDashboard }] },
            {
                items: [
                    { label: "أبنائي", to: "/parent/children", icon: Users },
                    { label: "التقارير", to: "/parent/reports", icon: FileText },
                ],
            },
        ]
    }

    if (role === "employee") {
        return [
            { items: [{ label: "لوحة القيادة", to: "/employee", icon: LayoutDashboard }] },
            {
                items: [
                    { label: "المهام", to: "/employee/tasks", icon: ClipboardList },
                    { label: "الأشخاص", to: "/employee/people", icon: Users },
                ],
            },
        ]
    }

    // افتراضي (لو مافي دور)
    return [{ items: [{ label: "لوحة القيادة", to: "/admin", icon: LayoutDashboard }] }]
}

