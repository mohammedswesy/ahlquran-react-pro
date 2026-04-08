import api from "./api"
import type { Institute } from "./institutes"
import type { Role } from "@/store/auth"

/* ======================================================
 * Admin Dashboard
 * ====================================================== */

export type DashboardStats = {
    institutes?: number
    revenue?: number
    institutes_count?: number
    total_revenue?: number
    parents: number
    circles: number
    teachers: number
    students: number
    students_count?: number
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

export async function fetchDashboard(role?: Role | null): Promise<DashboardResponse> {
    const currentRole =
        role ??
        ((typeof window !== "undefined" ? localStorage.getItem("role") : null) as Role | null)

    const isInstituteAdmin =
        currentRole === "institute-admin" || currentRole === "sub-admin"

    const endpoint = isInstituteAdmin ? "/dashboard/institute-admin" : "/admin/dashboard"
    const { data } = await api.get(endpoint)

    const root = data?.data ?? data ?? {}

    const statsSrc = root?.stats ?? root?.totals ?? {}
    const recentSrc = root?.recent_institutes ?? root?.recentInstitutes ?? root?.institutes ?? []

    const mappedStats: DashboardStats = {
        institutes: Number(statsSrc?.institutes ?? statsSrc?.institutes_count ?? 0),
        revenue: Number(statsSrc?.revenue ?? statsSrc?.total_revenue ?? 0),
        institutes_count: Number(statsSrc?.institutes_count ?? statsSrc?.institutes ?? 0),
        total_revenue: Number(statsSrc?.total_revenue ?? statsSrc?.revenue ?? 0),
        parents: Number(statsSrc?.parents ?? 0),
        circles: Number(statsSrc?.circles ?? statsSrc?.circles_count ?? 0),
        teachers: Number(statsSrc?.teachers ?? statsSrc?.teachers_count ?? 0),
        students: Number(statsSrc?.students ?? statsSrc?.students_count ?? 0),
        students_count: Number(statsSrc?.students_count ?? statsSrc?.students ?? 0),
    }

    const mappedRecent = isInstituteAdmin ? [] : (Array.isArray(recentSrc) ? recentSrc : [])

    return {
        stats: mappedStats,
        recentInstitutes: mappedRecent,
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

/* ======================================================
 * Teacher Stats (KPI endpoint)
 * ====================================================== */

export type TeacherStats = {
    total_students: number
    active_circles: number
    today_attendance_percent: number
    pending_exams: number
}

export async function listMyStats(): Promise<TeacherStats> {
    const { data } = await api.get("/teacher/stats").catch(() => ({ data: {} as any }))
    const root = data?.data ?? data ?? {}
    return {
        total_students: Number(root?.total_students ?? root?.students ?? 0),
        active_circles: Number(root?.active_circles ?? root?.circles ?? 0),
        today_attendance_percent: Number(
            root?.today_attendance_percent ?? root?.today_attendance ?? 0,
        ),
        pending_exams: Number(root?.pending_exams ?? root?.exams ?? 0),
    }
}

/* ======================================================
 * Teacher Recent Activity
 * ====================================================== */

export type ActivityEntry = {
    id?: number
    type: "attendance" | "memorization" | "review" | "assessment" | "general"
    student_name?: string | null
    circle_name?: string | null
    description: string
    date: string
}

export async function listMyRecentActivity(): Promise<ActivityEntry[]> {
    const { data } = await api
        .get("/teacher/recent-activity")
        .catch(() => ({ data: {} as any }))
    const root = data?.data ?? data ?? {}
    const src: any[] = Array.isArray(root) ? root : Array.isArray(root?.items) ? root.items : []
    return src.map((item: any) => ({
        id: item?.id ?? undefined,
        type: (item?.type ?? "general") as ActivityEntry["type"],
        student_name: item?.student_name ?? item?.student?.name ?? null,
        circle_name: item?.circle_name ?? item?.circle?.name ?? null,
        description: String(item?.description ?? item?.message ?? item?.note ?? ""),
        date: String(item?.date ?? item?.created_at ?? ""),
    }))
}
