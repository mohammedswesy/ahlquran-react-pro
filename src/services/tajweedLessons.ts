import api from "@/services/api"

export type LessonLevel = "beginner" | "intermediate" | "advanced" | string

export type TajweedLesson = {
  id: number
  title: string
  description?: string | null
  level?: LessonLevel | null
  video_url?: string | null
  file_url?: string | null
  file_path?: string | null
  [k: string]: any
}

export type StudentLessonsResponse = {
  lessons: TajweedLesson[]
  studentLevel?: string | null
}

function normalizeLesson(raw: any): TajweedLesson {
  return {
    ...raw,
    id: Number(raw?.id ?? 0),
    title: String(raw?.title ?? raw?.name ?? "").trim(),
    description: raw?.description ?? raw?.summary ?? null,
    level: raw?.level ?? raw?.lesson_level ?? raw?.target_level ?? null,
    video_url: raw?.video_url ?? raw?.youtube_url ?? raw?.video ?? null,
    file_url: raw?.file_url ?? raw?.pdf_url ?? raw?.resource_url ?? null,
    file_path: raw?.file_path ?? raw?.pdf_path ?? raw?.file ?? null,
  }
}

function unwrapLessons(data: any): TajweedLesson[] {
  const source =
    Array.isArray(data) ? data :
    Array.isArray(data?.data) ? data.data :
    Array.isArray(data?.lessons) ? data.lessons :
    []

  return source
    .map(normalizeLesson)
    .filter((lesson: TajweedLesson) => Number.isFinite(lesson.id) && lesson.id > 0 && lesson.title)
}

export async function listStudentLessons(): Promise<StudentLessonsResponse> {
  const { data } = await api.get("/student/lessons")
  const root = data?.data ?? data

  return {
    lessons: unwrapLessons(root),
    studentLevel: root?.student_level ?? root?.level ?? root?.student?.level ?? null,
  }
}

export async function listAdminLessons(): Promise<TajweedLesson[]> {
  const endpoints = ["/admin/lessons", "/lessons"]

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.get(endpoint, { params: { per_page: 200 } })
      return unwrapLessons(data?.data ?? data)
    } catch {
      continue
    }
  }

  return []
}

export async function createAdminLesson(payload: FormData): Promise<TajweedLesson> {
  const endpoints = ["/admin/lessons", "/lessons"]

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.post(endpoint, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return normalizeLesson(data?.data ?? data)
    } catch {
      continue
    }
  }

  throw new Error("Failed to create lesson")
}
