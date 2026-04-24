import api from "@/services/api"

export type QuizOption = {
  id: number
  text: string
  is_correct?: boolean
  [k: string]: any
}

export type QuizQuestion = {
  id: number
  text: string
  options: QuizOption[]
  [k: string]: any
}

export type StudentQuiz = {
  id: number
  title: string
  lesson_id?: number | null
  lesson_title?: string | null
  questions: QuizQuestion[]
  [k: string]: any
}

export type QuizSubmissionResult = {
  score: number
  total: number
  passed?: boolean
  [k: string]: any
}

export type AdminQuizQuestionInput = {
  text: string
  options: Array<{ text: string; is_correct: boolean }>
}

export type AdminQuizCreatePayload = {
  title: string
  lesson_id: number
  questions: AdminQuizQuestionInput[]
}

function normalizeOption(raw: any): QuizOption {
  return {
    ...raw,
    id: Number(raw?.id ?? 0),
    text: String(raw?.text ?? raw?.title ?? raw?.option_text ?? "").trim(),
    is_correct: Boolean(raw?.is_correct),
  }
}

function normalizeQuestion(raw: any): QuizQuestion {
  const source = Array.isArray(raw?.options)
    ? raw.options
    : Array.isArray(raw?.answers)
      ? raw.answers
      : []

  return {
    ...raw,
    id: Number(raw?.id ?? 0),
    text: String(raw?.text ?? raw?.question ?? raw?.question_text ?? "").trim(),
    options: source.map(normalizeOption).filter((option) => option.id > 0 && option.text),
  }
}

function normalizeQuiz(raw: any): StudentQuiz {
  const questionsSource = Array.isArray(raw?.questions)
    ? raw.questions
    : Array.isArray(raw?.items)
      ? raw.items
      : []

  return {
    ...raw,
    id: Number(raw?.id ?? 0),
    title: String(raw?.title ?? raw?.name ?? "").trim(),
    lesson_id: raw?.lesson_id == null ? null : Number(raw.lesson_id),
    lesson_title: raw?.lesson_title ?? raw?.lesson?.title ?? null,
    questions: questionsSource.map(normalizeQuestion).filter((question) => question.id > 0 && question.text),
  }
}

function extractQuizzes(data: any): StudentQuiz[] {
  const source = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.quizzes)
        ? data.quizzes
        : []

  return source.map(normalizeQuiz).filter((quiz) => quiz.id > 0 && quiz.title)
}

export async function listStudentQuizzes(): Promise<StudentQuiz[]> {
  const endpoints = ["/student/quizzes", "/student/quiz", "/quizzes/student"]

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.get(endpoint)
      return extractQuizzes(data?.data ?? data)
    } catch {
      continue
    }
  }

  return []
}

export async function getStudentQuiz(id: number): Promise<StudentQuiz> {
  const endpoints = [
    `/student/quizzes/${id}`,
    `/student/quiz/${id}`,
    `/quizzes/student/${id}`,
  ]

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.get(endpoint)
      const quiz = normalizeQuiz(data?.data ?? data)
      if (quiz.id > 0) return quiz
    } catch {
      continue
    }
  }

  throw new Error("Failed to load quiz")
}

export async function submitStudentQuiz(
  quizId: number,
  answers: Array<{ question_id: number; option_id: number }>,
): Promise<QuizSubmissionResult> {
  const payload = { answers }

  const endpoints = [
    `/student/quizzes/${quizId}/submit`,
    `/student/quiz/${quizId}/submit`,
    `/quizzes/student/${quizId}/submit`,
  ]

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.post(endpoint, payload)
      const root = data?.data ?? data ?? {}
      return {
        ...root,
        score: Number(root?.score ?? root?.correct_answers ?? 0),
        total: Number(root?.total ?? root?.total_questions ?? answers.length),
        passed: typeof root?.passed === "boolean" ? root.passed : undefined,
      }
    } catch {
      continue
    }
  }

  throw new Error("Failed to submit quiz")
}

export async function listAdminQuizzes(): Promise<StudentQuiz[]> {
  const endpoints = ["/admin/quizzes", "/quizzes"]

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.get(endpoint, { params: { per_page: 200 } })
      return extractQuizzes(data?.data ?? data)
    } catch {
      continue
    }
  }

  return []
}

export async function createAdminQuiz(payload: AdminQuizCreatePayload): Promise<StudentQuiz> {
  const endpoints = ["/admin/quizzes", "/quizzes"]

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.post(endpoint, payload)
      return normalizeQuiz(data?.data ?? data)
    } catch {
      continue
    }
  }

  throw new Error("Failed to create quiz")
}
