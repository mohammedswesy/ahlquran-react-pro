import { useCallback, useEffect, useMemo, useState } from "react"

import { getStudentProfile } from "@/services/studentService"
import { listStudentLessons, type TajweedLesson } from "@/services/tajweedLessons"

type UseStudentLessonsResult = {
  lessons: TajweedLesson[]
  loading: boolean
  error: string | null
  studentLevel: string | null
  reload: () => Promise<void>
}

function normalizeLevel(value: unknown): string {
  const raw = String(value ?? "").trim().toLowerCase()
  if (!raw) return ""

  if (raw.includes("intermediate") || raw.includes("متوسط")) return "intermediate"
  if (raw.includes("beginner") || raw.includes("مبتد") || raw.includes("مبتدئ")) return "beginner"
  if (raw.includes("advanced") || raw.includes("متقدم")) return "advanced"

  return raw
}

function filterByLevel(lessons: TajweedLesson[], studentLevel: string | null): TajweedLesson[] {
  const normalizedStudentLevel = normalizeLevel(studentLevel)
  if (!normalizedStudentLevel) return lessons

  return lessons.filter((lesson) => normalizeLevel(lesson.level) === normalizedStudentLevel)
}

export function useStudentLessons(): UseStudentLessonsResult {
  const [lessons, setLessons] = useState<TajweedLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentLevel, setStudentLevel] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [lessonsRes, profileRes] = await Promise.allSettled([
        listStudentLessons(),
        getStudentProfile(),
      ])

      if (lessonsRes.status !== "fulfilled") {
        throw lessonsRes.reason
      }

      const apiStudentLevel = lessonsRes.value.studentLevel
      const profileStudentLevel =
        profileRes.status === "fulfilled"
          ? String(profileRes.value?.level ?? "").trim() || null
          : null

      const resolvedLevel = apiStudentLevel ? String(apiStudentLevel) : profileStudentLevel

      setStudentLevel(resolvedLevel || null)
      setLessons(filterByLevel(lessonsRes.value.lessons, resolvedLevel || null))
    } catch (err: any) {
      setError(err?.response?.data?.message || "تعذر تحميل دروس التجويد")
      setLessons([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return useMemo(
    () => ({ lessons, loading, error, studentLevel, reload: load }),
    [lessons, loading, error, studentLevel, load],
  )
}
