
import api from "./api"
import { normalizeId } from "@/lib/normalize"

export type MemorizationRecord = {
    id: number
    student_id: number
    circle_id: number
    employee_id: number
    session_date: string // YYYY-MM-DD
    from_surah: number
    from_ayah: number
    to_surah: number
    to_ayah: number
    pages_count?: number | null
    juz_number?: number | null
    evaluation?: number | null
    mistakes_count?: number | null
    notes?: string | null
}

function normalizeMemRecord(raw: any): MemorizationRecord {
    const x = normalizeId(raw)
    return {
        id: x.id,
        student_id: x.student_id,
        circle_id: x.circle_id,
        employee_id: x.employee_id,
        session_date: x.session_date,
        from_surah: Number(x.from_surah),
        from_ayah: Number(x.from_ayah),
        to_surah: Number(x.to_surah),
        to_ayah: Number(x.to_ayah),
        pages_count: x.pages_count ? Number(x.pages_count) : null,
        juz_number: x.juz_number ? Number(x.juz_number) : null,
        evaluation: x.evaluation ? Number(x.evaluation) : null,
        mistakes_count: x.mistakes_count ? Number(x.mistakes_count) : null,
        notes: x.notes ?? null,
    }
}

/** جلب سجلات الحفظ لحلقة معيّنة في تاريخ معيّن (اختياري) */
export async function listCircleMemorization(circleId: number, date?: string): Promise<MemorizationRecord[]> {
    const params: any = {}
    if (date) params.date = date

    const { data } = await api.get(`/teacher/circles/${circleId}/memorization`, { params })
    const src = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    return src.map(normalizeMemRecord)
}

/** إضافة سجل حفظ لطالب معيّن داخل حلقة معيّنة */
export async function createMemorizationRecord(payload: {
    circle_id: number
    student_id: number
    session_date: string
    from_surah: number
    from_ayah: number
    to_surah: number
    to_ayah: number
    pages_count?: number | null
    juz_number?: number | null
    evaluation?: number | null
    mistakes_count?: number | null
    notes?: string | null
}) {
    const { circle_id, student_id, ...rest } = payload
    const { data } = await api.post(`/teacher/circles/${circle_id}/students/${student_id}/memorization`, rest)
    return data
}
