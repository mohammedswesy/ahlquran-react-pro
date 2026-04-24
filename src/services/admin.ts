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

export type AdminOverviewStat = {
    total_students: number
    new_students_last_30_days: number
    active_teachers: number
    base_salary_sum: number
    monthly_base_salaries: number
    pending_payouts: number
    attendance_today_percentage: number
    monthly_registrations: Array<{ month: string; value: number }>
    level_distribution: Array<{ level: string; count: number }>
    payroll_list: Array<{
        id: number | string
        employee_name: string
        base_salary: number
        allowances: number
        deductions: number
        net_salary: number
        status: string
    }>
    critical_alerts: Array<{ id: number | string; student_name: string; absences_count: number; circle_name?: string | null }>
    recent_activity: Array<{ id: number | string; action: string; created_at?: string | null }>
}

function toNumber(value: any): number {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}

function normalizeMonthlyRegistrations(src: any): Array<{ month: string; value: number }> {
    if (!Array.isArray(src)) return []

    return src
        .map((item: any) => ({
            month: String(item?.month ?? item?.label ?? item?.name ?? ""),
            value: toNumber(item?.value ?? item?.count ?? item?.students ?? item?.registrations),
        }))
        .filter((item: any) => item.month)
}

function normalizeLevelDistribution(src: any): Array<{ level: string; count: number }> {
    if (!Array.isArray(src)) return []

    return src
        .map((item: any) => ({
            level: String(item?.level ?? item?.name ?? item?.label ?? "غير محدد"),
            count: toNumber(item?.count ?? item?.value ?? item?.students),
        }))
        .filter((item: any) => item.level)
}

function normalizeCriticalAlerts(src: any): Array<{ id: number | string; student_name: string; absences_count: number; circle_name?: string | null }> {
    if (!Array.isArray(src)) return []

    return src
        .map((item: any, index: number) => ({
            id: item?.id ?? item?.student_id ?? `alert-${index}`,
            student_name: String(item?.student_name ?? item?.name ?? item?.student?.name ?? "").trim(),
            absences_count: toNumber(item?.absences_count ?? item?.consecutive_absences ?? item?.count ?? 0),
            circle_name: item?.circle_name ?? item?.circle?.name ?? null,
        }))
        .filter((item: any) => item.student_name && item.absences_count > 0)
}

function normalizeActivity(src: any): Array<{ id: number | string; action: string; created_at?: string | null }> {
    if (!Array.isArray(src)) return []

    return src
        .map((item: any, index: number) => ({
            id: item?.id ?? `activity-${index}`,
            action: String(item?.action ?? item?.title ?? item?.message ?? "").trim(),
            created_at: item?.created_at ?? item?.date ?? null,
        }))
        .filter((item: any) => item.action)
}

function normalizePayrollList(src: any): Array<{
    id: number | string
    employee_name: string
    base_salary: number
    allowances: number
    deductions: number
    net_salary: number
    status: string
}> {
    const rows = Array.isArray(src)
        ? src
        : Array.isArray(src?.data)
            ? src.data
            : Array.isArray(src?.rows)
                ? src.rows
                : Array.isArray(src?.payroll)
                    ? src.payroll
                    : []

    return rows
        .map((item: any, index: number) => {
            const base = toNumber(item?.base_salary ?? item?.base ?? item?.salary)
            const allowances = toNumber(item?.allowances ?? item?.bonus ?? item?.extra)
            const deductions = toNumber(item?.deductions ?? item?.discount ?? item?.penalties)
            const net = toNumber(item?.net_salary ?? item?.net ?? base + allowances - deductions)

            return {
                id: item?.id ?? item?.employee_id ?? `payroll-${index}`,
                employee_name: String(item?.employee_name ?? item?.employee?.name ?? item?.name ?? "").trim(),
                base_salary: base,
                allowances,
                deductions,
                net_salary: net,
                status: String(item?.status ?? "pending"),
            }
        })
        .filter((row: any) => row.employee_name)
}

export async function getAdminStatsOverview(): Promise<AdminOverviewStat> {
    const root = await getFirst([
        "/admin/stats/overview",
        "/dashboard/admin/stats-overview",
        "/admin/dashboard/overview",
    ])
    const payrollSummaryRoot = await getFirst(["/admin/payroll"])
    const payrollDetailsRoot = await getFirst(["/employees/payroll"])

    const overview = root?.overview ?? root?.stats ?? root
    const payrollSummary = payrollSummaryRoot?.stats ?? payrollSummaryRoot?.overview ?? payrollSummaryRoot
    const payrollRows = normalizePayrollList(payrollDetailsRoot)

    const baseSalarySum = toNumber(
        payrollSummary?.base_salary_sum ??
        payrollSummary?.monthly_base_salaries ??
        overview?.base_salary_sum ??
        overview?.monthly_base_salaries,
    )

    const pendingPayouts = toNumber(
        payrollSummary?.pending_payouts ??
        payrollSummary?.pending_sum ??
        overview?.pending_payouts,
    )

    return {
        total_students: toNumber(overview?.total_students ?? overview?.students ?? overview?.students_count),
        new_students_last_30_days: toNumber(overview?.new_students_last_30_days ?? overview?.students_new_last_30_days ?? overview?.new_students),
        active_teachers: toNumber(overview?.active_teachers ?? overview?.teachers_active ?? overview?.teachers),
        base_salary_sum: baseSalarySum,
        monthly_base_salaries: baseSalarySum,
        pending_payouts: pendingPayouts,
        attendance_today_percentage: toNumber(overview?.attendance_today_percentage ?? overview?.attendance_rate ?? overview?.attendance_today),
        monthly_registrations: normalizeMonthlyRegistrations(overview?.monthly_registrations ?? overview?.registrations_monthly ?? overview?.registrations),
        level_distribution: normalizeLevelDistribution(overview?.level_distribution ?? overview?.students_by_level ?? overview?.levels),
        payroll_list: payrollRows,
        critical_alerts: normalizeCriticalAlerts(overview?.critical_alerts ?? overview?.alerts ?? overview?.students_alerts),
        recent_activity: normalizeActivity(overview?.recent_activity ?? overview?.activity_logs ?? overview?.logs),
    }
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
