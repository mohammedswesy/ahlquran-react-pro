import React, { useEffect, useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { createCircle, getCircle, updateCircle } from "@/services/circles"
import { useAuth } from "@/store/auth"
import ScheduleBuilder, { type Schedule } from "@/components/app/ScheduleBuilder"
import {
  CIRCLE_TRACK_OPTIONS,
  getCircleTrackDescription,
  normalizeCircleTrack,
  type CircleTrack,
} from "@/lib/circleTracks"

type FormState = {
  name: string
  type: string
  track: CircleTrack
  level: number | ""
  schedule: Schedule | null
  institute_id: number | ""
}

export default function CircleForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const editing = !!id && id !== "new"

  const role = useAuth((s) => s.role)
  const authInstituteId = useAuth((s) => s.instituteId)
  const isSuperAdmin = role === "super-admin"

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [institutes, setInstitutes] = useState<Array<{ id: number; name: string }>>([])

  useEffect(() => {
    if (!isSuperAdmin) return
    ;(async () => {
      try {
        const opts = await import("@/services/institutes").then((m) => m.listInstitutesOptions())
        setInstitutes(opts)
      } catch {
        setInstitutes([])
      }
    })()
  }, [isSuperAdmin])

  const [form, setForm] = useState<FormState>({
    name: "",
    type: "hifz",
    track: "iqra",
    level: "",
    schedule: null,
    institute_id: "",
  })

  useEffect(() => {
    if (editing) return

    const fromQuery = Number(searchParams.get("institute_id") || "")
    const queryInstituteId = Number.isFinite(fromQuery) && fromQuery > 0 ? fromQuery : null

    const fromAuth = Number(authInstituteId)
    const authResolvedInstituteId = Number.isFinite(fromAuth) && fromAuth > 0 ? fromAuth : null

    const fromStorage = Number(localStorage.getItem("institute_id") || "")
    const storageInstituteId = Number.isFinite(fromStorage) && fromStorage > 0 ? fromStorage : null

    const resolvedInstituteId = queryInstituteId ?? authResolvedInstituteId ?? storageInstituteId

    if (resolvedInstituteId) {
      setForm((prev) => ({ ...prev, institute_id: resolvedInstituteId }))
    }
  }, [editing, searchParams, authInstituteId])

  useEffect(() => {
    if (!editing) return
      ; (async () => {
        setLoading(true)
        try {
          const c = await getCircle(Number(id))

          // schedule ممكن يجي string أو object
          let schedule: any = null
          if (c.schedule) {
            if (typeof c.schedule === "string") {
              try {
                schedule = JSON.parse(c.schedule)
              } catch {
                schedule = null
              }
            } else {
              schedule = c.schedule
            }
          }

          setForm({
            name: c.name ?? "",
            type: (c.type ?? "hifz") as any,
            track: normalizeCircleTrack(c.track) ?? "iqra",
            level: (c.level ?? "") as any,
            schedule: schedule ?? null,
            institute_id: (c.institute_id ?? "") as any,
          })
        } catch (e: any) {
          toast.error(e?.response?.data?.message || "تعذر جلب بيانات الحلقة")
        } finally {
          setLoading(false)
        }
      })()
  }, [editing, id])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) return toast.error("اسم الحلقة مطلوب")

    if (isSuperAdmin) {
      if (form.institute_id === "" || Number(form.institute_id) <= 0) {
        return toast.error("اختيار المعهد مطلوب")
      }
    }

    // ✅ تحقق من الجدول (يدعم slots + from/to)
    if (form.schedule) {
      const days = Array.isArray(form.schedule.days) ? form.schedule.days : []
      if (days.length === 0) return toast.error("اختَر يوم واحد على الأقل في الجدول")

      const slots = Array.isArray((form.schedule as any).slots) ? (form.schedule as any).slots : []

      // لو ما فيه slots، نعتمد legacy from/to
      if (slots.length === 0) {
        if (!form.schedule.from || !form.schedule.to) {
          return toast.error("حدد وقت (من/إلى) في الجدول")
        }
        if (form.schedule.from >= form.schedule.to) {
          return toast.error("وقت (من) لازم يكون قبل (إلى)")
        }
      } else {
        // validate each slot
        for (const s of slots) {
          if (!s?.from || !s?.to) return toast.error("كل سطر وقت لازم يكون فيه (من/إلى)")
          if (s.from >= s.to) return toast.error("وقت (من) لازم يكون قبل (إلى) في كل سطر")
        }
      }
    }

    setSaving(true)
    try {
      const fromAuth = Number(authInstituteId)
      const authResolvedInstituteId = Number.isFinite(fromAuth) && fromAuth > 0 ? fromAuth : null

      const fromStorage = Number(localStorage.getItem("institute_id") || "")
      const storageInstituteId = Number.isFinite(fromStorage) && fromStorage > 0 ? fromStorage : null

      const resolvedInstituteId = isSuperAdmin
        ? Number(form.institute_id)
        : authResolvedInstituteId ?? storageInstituteId

      const payload: any = {
        name: form.name,
        type: form.type,
        track: form.track,
        level: form.level === "" ? null : Number(form.level),
        schedule: form.schedule, // نفس شكل JSON اللي كنت تستخدمه
        institute_id: resolvedInstituteId,
      }

      if (!payload.institute_id || Number(payload.institute_id) <= 0) {
        return toast.error("Institute ID is required")
      }

      if (editing) {
        await updateCircle(Number(id), payload)
        toast.success("تم التعديل")
      } else {
        await createCircle(payload)
        toast.success("تمت الإضافة")
      }

      nav("/admin/circles")
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل الحفظ")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div dir="rtl" className="space-y-4">
        <Header title={editing ? "تعديل حلقة" : "إضافة حلقة"} subtitle="بيانات الحلقة" />

        <div className="mx-auto w-full max-w-3xl">
          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <div className="font-extrabold text-[var(--text)]">
                {editing ? "تعديل بيانات الحلقة" : "إنشاء حلقة جديدة"}
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">
                اختر الأيام والأوقات من الجدول — بدون حقول وقت منفصلة.
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={onSubmit} className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="اسم الحلقة"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    disabled={loading}
                  />

                  <div>
                    <label className="block text-sm mb-1 text-[var(--text)]">النوع</label>
                    <select
                      className="w-full rounded-2xl border px-3 py-2 bg-white"
                      value={form.type}
                      onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                      disabled={loading}
                    >
                      <option value="hifz">حفظ</option>
                      <option value="tajweed">تجويد</option>
                      <option value="arabic">لغة عربية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1 text-[var(--text)]">المسار التعليمي</label>
                    <Select
                      value={form.track}
                      onValueChange={(value) => setForm((p) => ({ ...p, track: value as CircleTrack }))}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المسار التعليمي" />
                      </SelectTrigger>
                      <SelectContent>
                        {CIRCLE_TRACK_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {getCircleTrackDescription(form.track)}
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <div>
                      <label className="block text-sm mb-1 text-[var(--text)]">المعهد</label>
                      <select
                        className="w-full rounded-2xl border px-3 py-2 bg-white text-right"
                        value={form.institute_id as any}
                        onChange={(e) => setForm((p) => ({ ...p, institute_id: e.target.value as any }))}
                        disabled={loading}
                      >
                        <option value="">اختر المعهد…</option>
                        {institutes.map((i) => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <Input
                    label="المستوى"
                    type="number"
                    placeholder="مثال: 1"
                    value={form.level as any}
                    onChange={(e) => setForm((p) => ({ ...p, level: e.target.value as any }))}
                    disabled={loading}
                  />
                </div>

                {/* ✅ الجدول */}
                <ScheduleBuilder
                  value={form.schedule}
                  onChange={(schedule) => setForm((p) => ({ ...p, schedule }))}
                  disabled={loading}
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => nav(-1)}>
                    إلغاء
                  </Button>
                  <Button disabled={saving || loading} type="submit">
                    {saving ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
