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
    // أدوار المشرفين (نفس المنيو)
    const isAdmin =
        role === "super-admin" ||
        role === "org-admin" ||
        role === "institute-admin" ||
        role === "sub-admin"

    const isSuperAdmin = role === "super-admin"

    if (isAdmin) {
        return [
            {
                items: [{ label: "لوحة القيادة", to: "/admin", icon: LayoutDashboard }],
            },
            {
                title: "الإدارة",
                items: [
                    // ✅ سوبر أدمن فقط
                    ...(isSuperAdmin
                        ? [{ label: "المعاهد", to: "/admin/institutes", icon: School }]
                        : []),

                    { label: "الحلقات", to: "/admin/circles", icon: BookOpen },

                    // ✅ سوبر أدمن فقط (لأن الراوت عندك محمي سوبر)
                    ...(isSuperAdmin
                        ? [{ label: "المعلّمون", to: "/admin/employees", icon: UserCog }]
                        : []),

                    { label: "الطلاب", to: "/admin/students", icon: Users },
                    { label: "أولياء الأمور", to: "/admin/parents", icon: Users },
                ],
            },
            {
                title: "تشغيل",
                items: [
                    { label: "الحضور والغياب", to: "/admin/attendance", icon: ClipboardList },
                    { label: "التقارير", to: "/admin/reports", icon: FileText },
                    { label: "الإشعارات", to: "/admin/notifications", icon: Bell },
                    { label: "إحصاءات", to: "/admin/stats", icon: LineChart },
                ],
            },
            {
                title: "أخرى",
                items: [
                    { label: "المكتبة", to: "/admin/library", icon: Library },
                    { label: "المقرأة الإلكترونية", to: "/admin/erecite", icon: Laptop },
                    { label: "إعداد البطاقات", to: "/admin/cards", icon: IdCard },
                    { label: "الإعدادات", to: "/admin/settings", icon: Settings },
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

