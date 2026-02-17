import type { IconType } from "react-icons"
import {
    PiSquaresFourBold,
    PiBuildingsBold,
    PiBookOpenTextBold,
    PiUsersThreeBold,
    PiBellBold,
    PiChalkboardTeacherBold,
    PiChartLineBold,
    PiClipboardTextBold,
    PiGearBold,
    PiBooksBold,
} from "react-icons/pi"

export type Role =
    | "super-admin"
    | "org-admin"
    | "institute-admin"
    | "sub-admin"
    | "teacher"
    | "student"
    | "parent"
    | "employee"

export type NavItem = {
    key: string
    label: string
    to: string
    icon: IconType
    roles: Role[]
    badgeKey?: string
}

export type NavSection = {
    key: string
    label: string
    roles: Role[]
    items: NavItem[]
}

/** ========= Roles Buckets ========= */
const SUPER_ADMIN: Role[] = ["super-admin"]

// أدمنز المعاهد/المنظمة (إدارة داخلية وليست نظام عام)
const ORG_ADMINS: Role[] = ["org-admin", "institute-admin", "sub-admin"]

// كل الأدمنز (سوبر + أدمنز إدارة)
const ALL_ADMINS: Role[] = ["super-admin", ...ORG_ADMINS]

const ALL_USERS: Role[] = ["teacher", "student", "parent", "employee", ...ALL_ADMINS]

export const NAV_SECTIONS: NavSection[] = [
    /** ========= Dashboards ========= */
    {
        key: "dashboards",
        label: "لوحات",
        roles: ALL_USERS,
        items: [
            // سوبر أدمن: لوحة النظام العامة
            { key: "admin_dash", label: "لوحة القيادة", to: "/admin", icon: PiSquaresFourBold, roles: ALL_ADMINS },
           {
                key: "inst_dash",
                label: "لوحة مدير المعهد",
                to: "/institute/dashboard",
                icon: PiSquaresFourBold,
                roles: ["institute-admin", "sub-admin"],
            },


            { key: "teacher_dash", label: "لوحة المعلم", to: "/teacher", icon: PiSquaresFourBold, roles: ["teacher"] },
            { key: "student_dash", label: "لوحة الطالب", to: "/student", icon: PiSquaresFourBold, roles: ["student"] },
            { key: "parent_dash", label: "لوحة ولي الأمر", to: "/parent", icon: PiSquaresFourBold, roles: ["parent"] },
            { key: "employee_dash", label: "لوحة الموظف", to: "/employee", icon: PiSquaresFourBold, roles: ["employee"] },
        ],
    },

    /** ========= Admin Management ========= */
    {
        key: "management",
        label: "إدارة",
        roles: ALL_ADMINS,
        items: [

            { key: "institutes", label: "المعاهد", to: "/admin/institutes", icon: PiBuildingsBold, roles: SUPER_ADMIN },
            { key: "employees", label: "الموظفون", to: "/admin/employees", icon: PiChalkboardTeacherBold, roles: SUPER_ADMIN },

            { key: "circles", label: "الحلقات", to: "/admin/circles", icon: PiBookOpenTextBold, roles: ALL_ADMINS },
            { key: "students", label: "الطلبة", to: "/admin/students", icon: PiUsersThreeBold, roles: ALL_ADMINS },
            { key: "parents", label: "أولياء الأمور", to: "/admin/parents", icon: PiUsersThreeBold, roles: ALL_ADMINS },
            { key: "teachers", label: "المعلمون", to: "/admin/teachers", icon: PiUsersThreeBold, roles: ALL_ADMINS },
        ],
    },

    /** ========= Operations ========= */
    {
        key: "operations",
        label: "تشغيل",
        roles: ["teacher", "student", "parent", ...ORG_ADMINS, ...SUPER_ADMIN],
        items: [
            // Teacher
            { key: "attendance", label: "الحضور والغياب", to: "/teacher/attendance", icon: PiClipboardTextBold, roles: ["teacher"] },
            { key: "my_circles", label: "حلقاتي", to: "/teacher/circles", icon: PiBookOpenTextBold, roles: ["teacher"] },

            // Student
            { key: "student_schedule", label: "جدولي", to: "/student/schedule", icon: PiBookOpenTextBold, roles: ["student"] },

            // Parent
            { key: "parent_children", label: "أبنائي", to: "/parent/children", icon: PiUsersThreeBold, roles: ["parent"] },
            { key: "parent_reports", label: "التقارير", to: "/parent/reports", icon: PiChartLineBold, roles: ["parent"] },
        ],
    },

    /** ========= System ========= */
    {
        key: "system",
        label: "النظام",
        roles: ALL_USERS,
        items: [

            {
                key: "notifications",
                label: "الإشعارات",
                to: "/admin/notifications",
                icon: PiBellBold,
                roles: ALL_ADMINS,
                badgeKey: "notifications",
            },

            { key: "library", label: "المكتبة", to: "/library", icon: PiBooksBold, roles: ALL_USERS },
            { key: "settings", label: "الإعدادات", to: "/settings", icon: PiGearBold, roles: ALL_USERS },
        ],
    },
]
