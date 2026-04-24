import { useCallback, useEffect, useState } from "react"

import { fetchStudentDashboard, type StudentDashboardResponse } from "@/services/students"

type UseStudentDashboardResult = {
  data: StudentDashboardResponse
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

const DEFAULT_DASHBOARD: StudentDashboardResponse = {
  studentName: null,
  currentLevelName: null,
  progressPercent: 0,
  totals: {
    memorized_pages: 0,
    pages_memorized: 0,
    hifz_pages: 0,
    pages: 0,
    attendance_rate: 0,
    presence_percent: 0,
    attendance_percent: 0,
    average_grade: 0,
    avg_grade: 0,
    average_score: 0,
    grade_average: 0,
    circles: 0,
    circles_count: 0,
    active_circles: 0,
    progress_percent: 0,
    completion_rate: 0,
  },
  recentAttendance: [],
  recentActivities: [],
  recentAssessments: [],
}

function normalizeDashboardData(raw: StudentDashboardResponse | null | undefined): StudentDashboardResponse {
  const source = raw ?? DEFAULT_DASHBOARD
  const totals = (source.totals && typeof source.totals === "object") ? source.totals : {}
  const progressNumeric = Number(source.progressPercent)

  return {
    ...DEFAULT_DASHBOARD,
    ...source,
    studentName: source.studentName ? String(source.studentName) : null,
    currentLevelName: source.currentLevelName ? String(source.currentLevelName) : null,
    progressPercent: Number.isFinite(progressNumeric) ? Math.max(0, Math.min(100, progressNumeric)) : 0,
    totals: {
      ...DEFAULT_DASHBOARD.totals,
      ...totals,
    },
    recentAttendance: Array.isArray(source.recentAttendance) ? source.recentAttendance : [],
    recentActivities: Array.isArray(source.recentActivities) ? source.recentActivities : [],
    recentAssessments: Array.isArray(source.recentAssessments) ? source.recentAssessments : [],
  }
}

export function useStudentDashboard(): UseStudentDashboardResult {
  const [data, setData] = useState<StudentDashboardResponse>(DEFAULT_DASHBOARD)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await fetchStudentDashboard()
      setData(normalizeDashboardData(next))
    } catch (err: any) {
      setError(err?.response?.data?.message || "تعذر تحميل لوحة الطالب")
      setData(DEFAULT_DASHBOARD)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, reload: load }
}
