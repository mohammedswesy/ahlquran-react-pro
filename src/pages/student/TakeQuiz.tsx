import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { CheckCircle2, RefreshCw } from "lucide-react"

import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import {
  getStudentQuiz,
  listStudentQuizzes,
  submitStudentQuiz,
  type QuizSubmissionResult,
  type StudentQuiz,
} from "@/services/tajweedQuizzes"

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-emerald-100">
      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function TakeQuiz() {
  const [quizzes, setQuizzes] = useState<StudentQuiz[]>([])
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null)
  const [quiz, setQuiz] = useState<StudentQuiz | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<QuizSubmissionResult | null>(null)

  useEffect(() => {
    ;(async () => {
      setLoadingList(true)
      try {
        const rows = await listStudentQuizzes()
        setQuizzes(rows)
        if (rows[0]?.id) setSelectedQuizId(rows[0].id)
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "تعذر تحميل الاختبارات")
      } finally {
        setLoadingList(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!selectedQuizId) {
      setQuiz(null)
      return
    }

    ;(async () => {
      setLoadingQuiz(true)
      try {
        const data = await getStudentQuiz(selectedQuizId)
        setQuiz(data)
        setCurrentIndex(0)
        setAnswers({})
        setResult(null)
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "تعذر تحميل تفاصيل الاختبار")
        setQuiz(null)
      } finally {
        setLoadingQuiz(false)
      }
    })()
  }, [selectedQuizId])

  const totalQuestions = quiz?.questions.length || 0
  const currentQuestion = quiz?.questions[currentIndex]
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])
  const progress = totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0

  const onSelectOption = (questionId: number, optionId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  }

  const onSubmitQuiz = async () => {
    if (!quiz) return

    if (answeredCount < totalQuestions) {
      toast.warning("أجب على جميع الأسئلة قبل التسليم")
      return
    }

    const confirmed = window.confirm("هل أنت متأكد من تسليم الاختبار؟")
    if (!confirmed) return

    setSubmitting(true)
    try {
      const payload = quiz.questions.map((question) => ({
        question_id: question.id,
        option_id: Number(answers[question.id]),
      }))

      const submitRes = await submitStudentQuiz(quiz.id, payload)
      setResult(submitRes)
      toast.success("تم تسليم الاختبار")
    } catch (err: any) {
      // fallback local correction if answer keys are present
      const localScore = quiz.questions.reduce((score, question) => {
        const selected = Number(answers[question.id])
        const correct = question.options.find((option) => option.is_correct)?.id
        return score + (selected && correct && selected === correct ? 1 : 0)
      }, 0)

      setResult({ score: localScore, total: quiz.questions.length })
      toast.info(err?.response?.data?.message || "تم عرض نتيجة محلية")
    } finally {
      setSubmitting(false)
    }
  }

  const onTryAgain = () => {
    setCurrentIndex(0)
    setAnswers({})
    setResult(null)
  }

  return (
    <AppLayout>
      <div dir="rtl" className="space-y-6">
        <Header title="الاختبارات" subtitle="اختبر فهمك للدروس خطوة بخطوة" />

        <Card className="border-emerald-100 bg-white/95">
          <CardContent className="p-4">
            {loadingList ? (
              <Skeleton className="h-11 w-full rounded-xl" />
            ) : quizzes.length === 0 ? (
              <div className="text-sm text-slate-600">لا توجد اختبارات متاحة حالياً.</div>
            ) : (
              <select
                className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={selectedQuizId ?? ""}
                onChange={(event) => setSelectedQuizId(Number(event.target.value))}
              >
                {quizzes.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            )}
          </CardContent>
        </Card>

        {loadingQuiz ? (
          <Card className="border-emerald-100 bg-white/95">
            <CardContent className="space-y-4 p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </CardContent>
          </Card>
        ) : quiz && totalQuestions > 0 ? (
          result ? (
            <Card className="border-emerald-100 bg-white/95">
              <CardContent className="space-y-5 p-6 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-black text-slate-900">نتيجتك: {result.score}/{result.total}</h2>
                <p className="text-sm text-slate-600">
                  {(result.score / Math.max(result.total, 1)) >= 0.7 ? "Success" : "Try Again"}
                </p>
                <div className="flex justify-center gap-3">
                  <Button onClick={onTryAgain} className="rounded-xl bg-emerald-700 hover:bg-emerald-800">
                    إعادة المحاولة
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => selectedQuizId && setSelectedQuizId(selectedQuizId)}
                  >
                    اختيار اختبار آخر
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-emerald-100 bg-white/95">
              <CardContent className="space-y-5 p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>السؤال {currentIndex + 1} من {totalQuestions}</span>
                    <span>المتبقي {totalQuestions - answeredCount}</span>
                  </div>
                  <ProgressBar value={progress} />
                </div>

                {currentQuestion && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                    <h3 className="text-base font-black text-slate-900">{currentQuestion.text}</h3>
                    <div className="mt-4 space-y-2">
                      {currentQuestion.options.map((option) => {
                        const checked = Number(answers[currentQuestion.id]) === option.id
                        return (
                          <label
                            key={option.id}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${checked ? "border-emerald-500 bg-emerald-100" : "border-emerald-100 bg-white hover:border-emerald-300"}`}
                          >
                            <input
                              type="radio"
                              className="h-4 w-4 accent-emerald-600"
                              name={`question-${currentQuestion.id}`}
                              checked={checked}
                              onChange={() => onSelectOption(currentQuestion.id, option.id)}
                            />
                            <span className="text-slate-800">{option.text}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  >
                    السابق
                  </Button>

                  {currentIndex < totalQuestions - 1 ? (
                    <Button
                      className="rounded-xl bg-emerald-700 hover:bg-emerald-800"
                      onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    >
                      التالي
                    </Button>
                  ) : (
                    <Button
                      className="rounded-xl bg-amber-500 text-white hover:bg-amber-600"
                      onClick={() => void onSubmitQuiz()}
                      disabled={submitting}
                    >
                      {submitting ? <RefreshCw className="ml-2 h-4 w-4 animate-spin" /> : null}
                      Submit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        ) : null}
      </div>
    </AppLayout>
  )
}
