import api from "./api"
import type { Institute } from "./institutes"

/* ======================================================
 * Admin Dashboard
 * ====================================================== */

export type DashboardStats = {
    parents: number
    circles: number
    teachers: number
    students: number
}

export type DashboardResponse = {
    stats: DashboardStats
    recentInstitutes: Institute[]
}

export type AttendancePoint = {
    date: string
    present: number
    absent: number
    late: number
    excused: number
}

export async function fetchDashboard(): Promise<DashboardResponse> {
    const { data } = await api.get("/admin/dashboard")

    return {
        stats: {
            parents: Number(data?.stats?.parents ?? 0),
            circles: Number(data?.stats?.circles ?? 0),
            teachers: Number(data?.stats?.teachers ?? 0),
            students: Number(data?.stats?.students ?? 0),
        },
        recentInstitutes: Array.isArray(data?.recent_institutes)
            ? data.recent_institutes
            : [],
    }
}

/* ======================================================
 * Teacher Dashboard
 * ====================================================== */

export type TeacherAttendancePoint = {
    date: string
    circle?: string
    present: number
    absent: number
    late: number
    excused: number
}

export type TeacherDashboard = {
    totals: {
        circles: number
        students: number
    }
    recentAttendance: TeacherAttendancePoint[]
}

export async function fetchTeacherDashboard(): Promise<TeacherDashboard> {
    const { data } = await api.get("/dashboard/teacher").catch(() => ({
        data: {} as any,
    }))

    const totalsSrc = (data?.totals ?? data?.stats ?? {}) as any
    const attendanceSrc =
        (data?.recentAttendance ??
            data?.attendance_week ??
            data?.attendance?.week ??
            []) as any[]

    const totals = {
        circles: Number(totalsSrc.circles ?? totalsSrc.my_circles ?? 0),
        students: Number(totalsSrc.students ?? totalsSrc.my_students ?? 0),
    }

    const recentAttendance: TeacherAttendancePoint[] = Array.isArray(attendanceSrc)
        ? attendanceSrc.map((p) => ({
            date: String(p.date ?? p.day ?? ""),
            circle: p.circle
                ? String(p.circle)
                : p.circle_name
                    ? String(p.circle_name)
                    : undefined,
            present: Number(p.present ?? p.p ?? 0),
            absent: Number(p.absent ?? p.a ?? 0),
            late: Number(p.late ?? p.l ?? 0),
            excused: Number(p.excused ?? p.e ?? 0),
        }))
        : []

    return { totals, recentAttendance }
}

/* ======================================================
 * Parent Dashboard ✅
 * ====================================================== */

export type ParentDashboardTotals = {
    children: number
    attendance: {
        total: number
        present: number
    }
}

export type ParentDashboardResponse = {
    totals: ParentDashboardTotals
    children: Array<{
        id: number
        name: string
        institute?: { id: number; name: string } | null
        circle?: { id: number; name: string } | null
    }>
    recent_attendance: any[]
    notifications: any[]
}

export async function fetchParentDashboard(): Promise<ParentDashboardResponse> {
    const { data } = await api.get("/parent/dashboard")

    return {
        totals: {
            children: Number(data?.totals?.children ?? 0),
            attendance: {
                total: Number(data?.totals?.attendance?.total ?? 0),
                present: Number(data?.totals?.attendance?.present ?? 0),
            },
        },
        children: Array.isArray(data?.children) ? data.children : [],
        recent_attendance: Array.isArray(data?.recent_attendance)
            ? data.recent_attendance
            : [],
        notifications: Array.isArray(data?.notifications)
            ? data.notifications
            : [],
    }
}
