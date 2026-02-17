// src/services/assessments.ts
import api from "./api"

export type AssessmentKind = "memorization" | "revision" | "tajweed" | "custom"

export type AssessmentItem = {
    student_id: number
    score?: number | null      // 0..100 أو حسب نظامك
    grade?: string | null      // A/B/C.. إن حبيت
    notes?: string | null
}

export async function submitAssessment(params: {
    circle_id: number
    date: string               // YYYY-MM-DD
    kind: AssessmentKind
    title?: string | null
    items: AssessmentItem[]
}) {
    // عدّل المسار حسب API عندك
    const { data } = await api.post("/assessments", params)
    return data
}
