import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { listStudents } from "@/services/students"
import { listInstitutesOptions } from "@/services/institutes"
import { listCirclesByInstitute, type Circle } from "@/services/circles"
import {
  createEnrollment,
  getEnrollment,
  updateEnrollment,
  type EnrollmentStatus,
} from "@/services/enrollments"

type Option = { id: number; name: string }

type FormState = {
  student_id: string
  institute_id: string
  circle_id: string
  status: EnrollmentStatus
  enrollment_date: string
  start_date: string
  end_date: string
  total_fees: string
  notes: string
}

const EMPTY_FORM: FormState = {
  student_id: "",
  institute_id: "",
  circle_id: "",
  status: "pending",
  enrollment_date: "",
  start_date: "",
  end_date: "",
  total_fees: "",
  notes: "",
}

export default function EnrollmentForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const nav = useNavigate()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [students, setStudents] = useState<Option[]>([])
  const [institutes, setInstitutes] = useState<Option[]>([])
  const [circles, setCircles] = useState<Circle[]>([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [studentsRes, institutesRes] = await Promise.all([
          listStudents({ per_page: 1000 } as any),
          listInstitutesOptions(),
        ])

        const studentsList = Array.isArray((studentsRes as any)?.data)
          ? (studentsRes as any).data
          : Array.isArray(studentsRes)
            ? studentsRes
            : []

        setStudents(studentsList.map((s: any) => ({ id: Number(s.id), name: String(s.name || "") })))
        setInstitutes(institutesRes)

        if (isEdit && id) {
          const e = await getEnrollment(Number(id))
          setForm({
            student_id: e?.student_id ? String(e.student_id) : "",
            institute_id: e?.institute_id ? String(e.institute_id) : "",
            circle_id: e?.circle_id ? String(e.circle_id) : "",
            status: e?.status || "pending",
            enrollment_date: e?.enrollment_date || "",
            start_date: e?.start_date || "",
            end_date: e?.end_date || "",
            total_fees: e?.total_fees ? String(e.total_fees) : "",
            notes: e?.notes || "",
          })

          if (e?.institute_id) {
            const circlesList = await listCirclesByInstitute(Number(e.institute_id))
            setCircles(circlesList)
          }
        }
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "تعذر تحميل بيانات نموذج التسجيل")
      } finally {
        setLoading(false)
      }
    })()
  }, [id, isEdit])

  useEffect(() => {
    if (!form.institute_id) {
      setCircles([])
      setForm((prev) => ({ ...prev, circle_id: "" }))
      return
    }

    ;(async () => {
      try {
        const circlesList = await listCirclesByInstitute(Number(form.institute_id))
        setCircles(circlesList)
      } catch {
        setCircles([])
      }
    })()
  }, [form.institute_id])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.student_id || !form.institute_id || !form.enrollment_date || !form.total_fees) {
      toast.error("يرجى تعبئة الحقول المطلوبة")
      return
    }

    setSaving(true)
    try {
      const payload = {
        student_id: Number(form.student_id),
        institute_id: Number(form.institute_id),
        circle_id: form.circle_id ? Number(form.circle_id) : null,
        status: form.status,
        enrollment_date: form.enrollment_date,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        total_fees: Number(form.total_fees),
        notes: form.notes || null,
      }

      if (isEdit && id) {
        await updateEnrollment(Number(id), payload)
        toast.success("تم تحديث التسجيل")
      } else {
        await createEnrollment(payload)
        toast.success("تم إنشاء التسجيل")
      }

      nav("/admin/enrollments", { replace: true })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "تعذر حفظ التسجيل")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-4" dir="rtl">جاري التحميل...</div>
  }

  return (
    <div className="space-y-4" dir="rtl">
      <Card>
        <CardHeader>{isEdit ? "تعديل تسجيل" : "تسجيل جديد"}</CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm mb-1 text-right">الطالب</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-right"
                value={form.student_id}
                onChange={(e) => setForm((prev) => ({ ...prev, student_id: e.target.value }))}
              >
                <option value="">اختر الطالب</option>
                {students.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 text-right">المعهد</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-right"
                value={form.institute_id}
                onChange={(e) => setForm((prev) => ({ ...prev, institute_id: e.target.value }))}
              >
                <option value="">اختر المعهد</option>
                {institutes.map((i) => (
                  <option key={i.id} value={String(i.id)}>{i.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 text-right">الحلقة</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-right"
                value={form.circle_id}
                onChange={(e) => setForm((prev) => ({ ...prev, circle_id: e.target.value }))}
                disabled={!form.institute_id}
              >
                <option value="">بدون حلقة</option>
                {circles.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 text-right">الحالة</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-right"
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as EnrollmentStatus }))}
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <Input
              label="تاريخ التسجيل"
              type="date"
              value={form.enrollment_date}
              onChange={(e) => setForm((prev) => ({ ...prev, enrollment_date: e.target.value }))}
            />
            <Input
              label="الرسوم"
              type="number"
              min={0}
              value={form.total_fees}
              onChange={(e) => setForm((prev) => ({ ...prev, total_fees: e.target.value }))}
            />
            <Input
              label="تاريخ البدء"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
            />
            <Input
              label="تاريخ الانتهاء"
              type="date"
              value={form.end_date}
              onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
            />

            <div className="md:col-span-2">
              <label className="block text-sm mb-1 text-right">ملاحظات</label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-right"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
              <Button type="button" variant="outline" onClick={() => nav("/admin/enrollments")}>إلغاء</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
