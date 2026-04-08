// يَخدم AdminDashboard ويستوعب أكثر من شكل استجابة من الـAPI

import api from "@/services/api"

export type DashboardStats = {
    institutes?: number
    parents?: number
    students?: number
    teachers?: number
    circles?: number
    [k: string]: any
}

export type AttendancePoint = {
    date: string
    present: number
    absent: number
    late: number
    excused: number
}

export type DashboardResponse = {
    stats: DashboardStats
    recentInstitutes: any[]
    attendance_week: AttendancePoint[]
}

/** تطبيع أشكال مختلفة للاستجابة */
function normalize(res: any): DashboardResponse {
    const stats = res?.stats ?? res?.totals ?? {}
    const recentInstitutes =
        Array.isArray(res?.recentInstitutes)
            ? res.recentInstitutes
            : Array.isArray(res?.recent_institutes)
                ? res.recent_institutes
                : []

    const rawA =
        Array.isArray(res?.attendance_week)
            ? res.attendance_week
            : Array.isArray(res?.attendance?.week)
                ? res.attendance.week
                : []

    const attendance_week: AttendancePoint[] = rawA.map((p: any) => ({
        date: String(p?.date ?? p?.day ?? ""),
        present: Number(p?.present ?? p?.p ?? 0),
        absent: Number(p?.absent ?? p?.a ?? 0),
        late: Number(p?.late ?? p?.l ?? 0),
        excused: Number(p?.excused ?? p?.e ?? 0),
    }))

    return { stats, recentInstitutes, attendance_week }
}

/** الاتصال الفعلي بالـAPI */
export async function fetchDashboard(): Promise<DashboardResponse> {
    const { data } = await api.get("/admin/dashboard")
    // يدعم أن ترجع الاستجابة مباشرة أو داخل {data}
    const payload = data?.data ?? data
    return normalize(payload)
}

export type InstituteStats = {
    total_students: number
    total_teachers: number
    active_circles: number
    monthly_expenses: number
}

export type ExpenseItem = {
    id: number
    category: string
    amount: number
    date: string
}

export type CircleStatusItem = {
    id: number
    name: string
    submitted_today: boolean
}

export type AttendanceOverview = {
    today_percentage: number
    circles: CircleStatusItem[]
}

async function getFirst(urls: string[]) {
    for (const url of urls) {
        try {
            const { data } = await api.get(url)
            return data?.data ?? data ?? {}
        } catch {
            continue
        }
    }
    return {}
}

export async function getInstituteStats(): Promise<InstituteStats> {
    const root = await getFirst([
        "/dashboard/institute-admin/stats",
        "/institute/dashboard/stats",
        "/dashboard/institute-admin",
    ])

    const s = root?.stats ?? root?.totals ?? root
    return {
        total_students: Number(s?.total_students ?? s?.students ?? s?.students_count ?? 0),
        total_teachers: Number(s?.total_teachers ?? s?.teachers ?? s?.teachers_count ?? 0),
        active_circles: Number(s?.active_circles ?? s?.circles ?? s?.circles_count ?? 0),
        monthly_expenses: Number(s?.monthly_expenses ?? s?.expenses_monthly ?? s?.expenses ?? 0),
    }
}

export async function getRecentExpenses(): Promise<ExpenseItem[]> {
    const root = await getFirst([
        "/dashboard/institute-admin/recent-expenses",
        "/institute/dashboard/recent-expenses",
        "/dashboard/institute-admin",
    ])

    const src = Array.isArray(root)
        ? root
        : Array.isArray(root?.recent_expenses)
            ? root.recent_expenses
            : Array.isArray(root?.expenses)
                ? root.expenses
                : []

    return src.slice(0, 5).map((x: any) => ({
        id: Number(x?.id ?? 0),
        category: String(x?.category ?? x?.type ?? "مصروف"),
        amount: Number(x?.amount ?? x?.value ?? 0),
        date: String(x?.date ?? x?.created_at ?? ""),
    }))
}

export async function getAttendanceOverview(): Promise<AttendanceOverview> {
    const root = await getFirst([
        "/dashboard/institute-admin/attendance-overview",
        "/institute/dashboard/attendance-overview",
        "/dashboard/institute-admin",
    ])

    const percentage = Number(
        root?.today_percentage ??
        root?.attendance_today_percentage ??
        root?.attendance?.today_percentage ??
        root?.attendance_rate ??
        0,
    )

    const circlesSrc = Array.isArray(root?.circles)
        ? root.circles
        : Array.isArray(root?.circle_status)
            ? root.circle_status
            : Array.isArray(root?.attendance?.circles)
                ? root.attendance.circles
                : []

    const circles: CircleStatusItem[] = circlesSrc.map((c: any) => ({
        id: Number(c?.id ?? c?.circle_id ?? 0),
        name: String(c?.name ?? c?.circle_name ?? "حلقة"),
        submitted_today: Boolean(
            c?.submitted_today ??
            c?.attendance_submitted_today ??
            c?.has_attendance_today ??
            c?.done,
        ),
    }))

    return { today_percentage: percentage, circles }
}
