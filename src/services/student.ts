import api from "@/services/api"

export type StudentProgressItem = {
    id: number
    type: "hifz" | "murajaa" | "revision" | "progress" | "other"
    title: string
    details?: string | null
    date: string
}

export type StudentAttendanceSummary = {
    total_days: number
    absences: number
    lates: number
    attendance_percent: number
}

export type UpcomingExam = {
    id: number
    subject: string
    date: string
    type?: string | null
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

export async function getMyProgress(): Promise<StudentProgressItem[]> {
    const root = await getFirst(["/student/progress", "/student/dashboard"])

    const src = Array.isArray(root)
        ? root
        : Array.isArray(root?.recent_progress)
            ? root.recent_progress
            : Array.isArray(root?.progress)
                ? root.progress
                : Array.isArray(root?.recent_hifz)
                    ? root.recent_hifz
                    : []

    return src.map((x: any) => ({
        id: Number(x?.id ?? 0),
        type: String(x?.type ?? x?.kind ?? "other") as StudentProgressItem["type"],
        title: String(x?.title ?? x?.achievement ?? x?.surah_name ?? "إنجاز جديد"),
        details: x?.details ?? x?.notes ?? x?.description ?? null,
        date: String(x?.date ?? x?.created_at ?? ""),
    }))
}

export async function getMyAttendance(): Promise<StudentAttendanceSummary> {
    const root = await getFirst([
        "/student/attendance-summary",
        "/student/attendance",
        "/student/dashboard",
    ])

    const a = root?.attendance ?? root?.summary ?? root?.totals ?? root
    const total = Number(a?.total_days ?? a?.total ?? a?.sessions ?? 0)
    const present = Number(a?.present ?? a?.present_days ?? 0)
    const absences = Number(a?.absences ?? a?.absent ?? a?.absent_days ?? 0)
    const lates = Number(a?.lates ?? a?.late ?? a?.late_days ?? 0)
    const attendance_percent = Number(
        a?.attendance_percent ?? a?.attendance_rate ?? (total > 0 ? (present / total) * 100 : 0),
    )

    return { total_days: total, absences, lates, attendance_percent }
}

export async function getUpcomingExams(): Promise<UpcomingExam[]> {
    const root = await getFirst(["/student/upcoming-exams", "/student/exams", "/student/dashboard"])

    const src = Array.isArray(root)
        ? root
        : Array.isArray(root?.upcoming_exams)
            ? root.upcoming_exams
            : Array.isArray(root?.exams)
                ? root.exams
                : []

    return src.map((x: any) => ({
        id: Number(x?.id ?? 0),
        subject: String(x?.subject ?? x?.title ?? x?.name ?? "اختبار"),
        date: String(x?.date ?? x?.exam_date ?? ""),
        type: x?.type ?? null,
    }))
}
