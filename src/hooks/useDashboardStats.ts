import { useCallback, useEffect, useState } from "react"

import api from "@/services/api"
import { useAuth } from "@/store/auth"

export type EducationSummary = {
  totals: {
    students: number
    teachers: number
    circles: number
    parents: number
  }
  modules: {
    attendanceTodayPercent: number
    memorizationProgressPercent: number
    evaluationsAveragePercent: number
    staffAttendancePercent: number
  }
  context: {
    instituteName: string | null
  }
  raw: Record<string, any>
}

function toNumber(value: unknown) {
  const next = Number(value ?? 0)
  return Number.isFinite(next) ? next : 0
}

function normalizeSummary(payload: any): EducationSummary {
  const root = payload?.data ?? payload ?? {}
  const totals = root?.totals ?? root?.stats ?? root?.summary ?? root
  const attendance = root?.attendance ?? {}
  const memorization = root?.memorization ?? root?.revision ?? root?.hifz ?? {}
  const evaluations = root?.evaluations ?? root?.assessment ?? root?.assessments ?? root?.exams ?? {}
  const staff = root?.staff ?? root?.employees ?? {}

  const institutes = Array.isArray(root?.institutes) ? root.institutes : []
  const inferredInstituteName =
    root?.institute_name ??
    root?.institute?.name ??
    institutes[0]?.name ??
    null

  return {
    totals: {
      students: toNumber(totals?.students ?? totals?.students_count ?? totals?.total_students),
      teachers: toNumber(totals?.teachers ?? totals?.teachers_count ?? totals?.total_teachers),
      circles: toNumber(totals?.circles ?? totals?.circles_count ?? totals?.active_circles ?? totals?.total_circles),
      parents: toNumber(totals?.parents ?? totals?.parents_count ?? totals?.total_parents),
    },
    modules: {
      attendanceTodayPercent: toNumber(
        attendance?.today_percentage ??
          attendance?.today_percent ??
          root?.attendance_today_percentage ??
          root?.attendance_rate,
      ),
      memorizationProgressPercent: toNumber(
        memorization?.completion_percentage ??
          memorization?.progress_percentage ??
          memorization?.avg_completion ??
          root?.memorization_completion_percentage,
      ),
      evaluationsAveragePercent: toNumber(
        evaluations?.average_score ??
          evaluations?.avg_score ??
          evaluations?.average_percentage ??
          root?.evaluations_average,
      ),
      staffAttendancePercent: toNumber(
        staff?.attendance_percentage ??
          staff?.today_percentage ??
          root?.staff_attendance_percentage,
      ),
    },
    context: {
      instituteName: inferredInstituteName,
    },
    raw: root,
  }
}

const EMPTY_SUMMARY: EducationSummary = {
  totals: {
    students: 0,
    teachers: 0,
    circles: 0,
    parents: 0,
  },
  modules: {
    attendanceTodayPercent: 0,
    memorizationProgressPercent: 0,
    evaluationsAveragePercent: 0,
    staffAttendancePercent: 0,
  },
  context: {
    instituteName: null,
  },
  raw: {},
}

export default function useDashboardStats() {
  const role = useAuth((s) => s.role)
  const authInstituteName = useAuth((s) => s.instituteName)
  const [stats, setStats] = useState<EducationSummary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const endpoint = role === "institute-admin" || role === "sub-admin"
        ? "/dashboard/institute-admin"
        : "/reports/education/summary"
      const { data } = await api.get(endpoint)
      const normalized = normalizeSummary(data)
      setStats({
        ...normalized,
        context: {
          instituteName: normalized.context.instituteName || authInstituteName || null,
        },
      })
    } catch (err: any) {
      setStats(EMPTY_SUMMARY)
      setError(err?.response?.data?.message || "تعذر تحميل ملخص الشؤون التعليمية")
    } finally {
      setLoading(false)
    }
  }, [authInstituteName, role])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { stats, loading, error, refresh }
}