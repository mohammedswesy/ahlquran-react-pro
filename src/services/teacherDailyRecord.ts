import api from "@/services/api"
import type { AttendanceStatus } from "@/services/attendances"

export type TeacherDailyRecordPayload = {
  date: string
  circle_id: number
  student_id: number
  attendance_status?: AttendanceStatus
  surah: string
  page_from: number
  page_to: number
  grade: string
  tajweed_lesson: string
  arabic_lesson: string
}

export async function createTeacherDailyRecord(payload: TeacherDailyRecordPayload) {
  const { data } = await api.post("/teacher/daily-record", payload)
  return data
}
