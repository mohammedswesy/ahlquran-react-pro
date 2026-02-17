// src/services/teacherAttendance.ts
import api from "@/services/api"

export type AttendanceStatus = "present" | "absent" | "late" | "excused"

export type SubmitAttendancePayload = {
    date: string // YYYY-MM-DD
    circle_id: number
    records: Array<{
        student_id: number
        status: AttendanceStatus
        notes?: string | null
    }>
}


export async function submitTeacherAttendance(payload: SubmitAttendancePayload) {
    const { data } = await api.post("/attendance", payload)
    return data
}
