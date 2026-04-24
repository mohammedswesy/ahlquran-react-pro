import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"

import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"

import { listAdminLessons, type TajweedLesson } from "@/services/tajweedLessons"
import {
  createAdminQuiz,
  listAdminQuizzes,
  type AdminQuizQuestionInput,
  type StudentQuiz,
} from "@/services/tajweedQuizzes"

type OptionDraft = {
  text: string
  is_correct: boolean
}

type QuestionDraft = {
  text: string
  options: OptionDraft[]
}

const EMPTY_OPTION = (): OptionDraft => ({ text: "", is_correct: false })
const EMPTY_QUESTION = (): QuestionDraft => ({
  text: "",
  options: [EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION()],
})

export default function QuizManagement() {
  const [lessons, setLessons] = useState<TajweedLesson[]>([])
  const [rows, setRows] = useState<StudentQuiz[]>([])
  const [loading, setLoading] = useState(true)

  const [openCreate, setOpenCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [quizTitle, setQuizTitle] = useState("")
  const [lessonId, setLessonId] = useState<number | null>(null)
  const [draftQuestion, setDraftQuestion] = useState<QuestionDraft>(EMPTY_QUESTION())
  const [questions, setQuestions] = useState<AdminQuizQuestionInput[]>([])

  async function load() {
    setLoading(true)
    try {
      const [lessonsRes, quizzesRes] = await Promise.all([
        listAdminLessons(),
        listAdminQuizzes(),
      ])
      setLessons(lessonsRes)
      setRows(quizzesRes)
      if (!lessonId && lessonsRes[0]?.id) setLessonId(lessonsRes[0].id)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "تعذر تحميل بيانات الاختبارات")
      setRows([])
      setLessons([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lessonMap = useMemo(() => {
    const map = new Map<number, string>()
    lessons.forEach((lesson) => map.set(lesson.id, lesson.title))
    return map
  }, [lessons])

  const setOption = (index: number, next: Partial<OptionDraft>) => {
    setDraftQuestion((prev) => {
      const options = [...prev.options]
      options[index] = { ...options[index], ...next }
      return { ...prev, options }
    })
  }

  const setCorrect = (index: number) => {
    setDraftQuestion((prev) => {
      const options = prev.options.map((option, idx) => ({ ...option, is_correct: idx === index }))
      return { ...prev, options }
    })
  }

  const addQuestion = () => {
    if (!draftQuestion.text.trim()) {
      toast.error("نص السؤال مطلوب")
      return
    }

    if (draftQuestion.options.some((option) => !option.text.trim())) {
      toast.error("اكتب الخيارات الأربعة كاملة")
      return
    }

    const correctCount = draftQuestion.options.filter((option) => option.is_correct).length
    if (correctCount !== 1) {
      toast.error("حدد إجابة صحيحة واحدة")
      return
    }

    setQuestions((prev) => [
      ...prev,
      {
        text: draftQuestion.text.trim(),
        options: draftQuestion.options.map((option) => ({
          text: option.text.trim(),
          is_correct: option.is_correct,
        })),
      },
    ])
    setDraftQuestion(EMPTY_QUESTION())
  }

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== index))
  }

  const createQuiz = async () => {
    if (!quizTitle.trim()) {
      toast.error("عنوان الاختبار مطلوب")
      return
    }

    if (!lessonId) {
      toast.error("اختر درس التجويد")
      return
    }

    if (questions.length === 0) {
      toast.error("أضف سؤالاً واحداً على الأقل")
      return
    }

    setSubmitting(true)
    try {
      await createAdminQuiz({
        title: quizTitle.trim(),
        lesson_id: lessonId,
        questions,
      })
      toast.success("تم إنشاء الاختبار بنجاح")

      setQuizTitle("")
      setQuestions([])
      setDraftQuestion(EMPTY_QUESTION())
      setOpenCreate(false)
      await load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إنشاء الاختبار")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppLayout>
      <div dir="rtl" className="space-y-6">
        <Header title="إدارة الاختبارات" subtitle="بناء اختبارات مرتبطة بدروس التجويد" />

        <Card className="border-emerald-100 bg-white/95">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="text-sm text-slate-700">
              إجمالي الاختبارات: <span className="font-black text-emerald-800">{loading ? "..." : rows.length}</span>
            </div>
            <Button className="rounded-xl bg-emerald-700 hover:bg-emerald-800" onClick={() => setOpenCreate(true)}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة اختبار جديد
            </Button>
          </CardContent>
        </Card>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="border-emerald-100 bg-white/95">
                <CardContent className="space-y-3 p-4">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
                </CardContent>
              </Card>
            ))
          ) : rows.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-emerald-100 bg-white p-8 text-center text-sm text-slate-600">
              لا توجد اختبارات بعد
            </div>
          ) : (
            rows.map((quiz) => (
              <Card key={quiz.id} className="border-emerald-100 bg-white/95 transition-all hover:-translate-y-1 hover:border-amber-300 hover:shadow-[0_14px_35px_rgba(4,120,87,0.14)]">
                <CardContent className="space-y-2 p-4">
                  <h2 className="text-base font-black text-slate-900">{quiz.title}</h2>
                  <p className="text-xs text-slate-500">الدرس: {quiz.lesson_title || (quiz.lesson_id ? lessonMap.get(quiz.lesson_id) : "—") || "—"}</p>
                  <p className="text-xs font-semibold text-emerald-700">عدد الأسئلة: {quiz.questions.length}</p>
                </CardContent>
              </Card>
            ))
          )}
        </section>

        <Modal
          open={openCreate}
          onClose={() => {
            if (submitting) return
            setOpenCreate(false)
          }}
          title="إضافة اختبار جديد"
          description="اربط الاختبار بدرس تجويد وحدد الأسئلة والخيارات"
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={submitting}>إلغاء</Button>
              <Button onClick={() => void createQuiz()} disabled={submitting} className="bg-emerald-700 hover:bg-emerald-800">
                {submitting ? "جاري الحفظ..." : "حفظ الاختبار"}
              </Button>
            </>
          }
        >
          <div className="space-y-4" dir="rtl">
            <Input
              label="عنوان الاختبار"
              value={quizTitle}
              onChange={(event) => setQuizTitle(event.target.value)}
              placeholder="مثال: اختبار أحكام المد"
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">ربط الدرس</label>
              <select
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                value={lessonId ?? ""}
                onChange={(event) => setLessonId(Number(event.target.value))}
              >
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
              <h3 className="text-sm font-black text-emerald-900">إضافة سؤال</h3>
              <Input
                label="نص السؤال"
                value={draftQuestion.text}
                onChange={(event) => setDraftQuestion((prev) => ({ ...prev, text: event.target.value }))}
              />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {draftQuestion.options.map((option, index) => (
                  <div key={index} className="rounded-lg border border-emerald-100 bg-white p-3 space-y-2">
                    <Input
                      label={`الخيار ${index + 1}`}
                      value={option.text}
                      onChange={(event) => setOption(index, { text: event.target.value })}
                    />
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-emerald-600"
                        checked={option.is_correct}
                        onChange={() => setCorrect(index)}
                      />
                      الإجابة الصحيحة
                    </label>
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" className="rounded-lg" onClick={addQuestion}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة السؤال للقائمة
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900">الأسئلة المضافة ({questions.length})</h3>
              {questions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-xs text-slate-500">لم تتم إضافة أسئلة بعد.</div>
              ) : (
                questions.map((question, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{index + 1}. {question.text}</p>
                        <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                          {question.options.map((option, optionIndex) => (
                            <li key={optionIndex}>
                              {option.is_correct ? "✔" : "-"} {option.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button
                        type="button"
                        className="rounded p-1 text-rose-600 hover:bg-rose-50"
                        onClick={() => removeQuestion(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  )
}
