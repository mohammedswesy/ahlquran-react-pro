// src/pages/admin/StudentsList.tsx
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useInstituteGuard } from "@/hooks/useInstituteGuard"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

import ExportMenu from "@/components/app/ExportMenu"
import { PageHeader } from "@/components/ui/page"

import {
  Users,
  UserCheck,
  Check as CheckIcon,
  Edit2,
  MoreVertical,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  ChevronsUpDown,
} from "lucide-react"

import {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  type Student,
} from "@/services/students"

import { listInstitutesOptions } from "@/services/institutes"
import { listCirclesByInstitute, type Circle } from "@/services/circles"

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import TenantViewBanner from "@/components/ui/tenant-banner"

import StudentForm, { type StudentFormValues } from "./StudentForm"
import LoadingBar from "@/components/ui/loading-bar"
import ModalFormShell from "@/components/ui/modal-form-shell"
import CreateStudentModal, { type CreateStudentSubmitPayload } from "@/components/app/CreateStudentModal"
import { Skeleton } from "@/components/ui/skeleton"
import EmptyState from "@/components/ui/empty-state"

export default function StudentsList() {
  const nav = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  // ====== Table state ======
  const [rows, setRows] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [perPage] = useState(12)

  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState<Student | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ====== Filters (institute / circle) ======
  const [filterInstituteId, setFilterInstituteId] = useState<number | undefined>(undefined)
  const [filterCircleId, setFilterCircleId] = useState<number | undefined>(undefined)

  // ====== Institute guard (locks institute-admin to own institute) ======
  const { isRestricted, ownInstituteId } = useInstituteGuard({ filterInstituteId, setFilterInstituteId })

  // ====== lookups for names (id -> name) ======
  const [instOptions, setInstOptions] = useState<Array<{ id: number; name: string }>>([])
  const [circleOptions, setCircleOptions] = useState<Circle[]>([])

  const [instOpen, setInstOpen] = useState(false)
  const [circleOpen, setCircleOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get("create") !== "1") return
    setOpenCreate(true)
    const next = new URLSearchParams(searchParams)
    next.delete("create")
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  // Load institute options once
  useEffect(() => {
    ; (async () => {
      try {
        const insts = await listInstitutesOptions()
        setInstOptions(insts)
      } catch {
        // ignore
      }
    })()
  }, [])

  // Load circle options based on selected institute (for filter)
  useEffect(() => {
    ; (async () => {
      try {
        if (!filterInstituteId) {
          setCircleOptions([])
          setFilterCircleId(undefined)
          return
        }
        const circles = await listCirclesByInstitute(filterInstituteId)
        setCircleOptions(circles)
        if (!circles.some((c) => c.id === filterCircleId)) setFilterCircleId(undefined)
      } catch {
        // ignore
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterInstituteId])

  // ====== Load data ======
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listStudents({
        page,
        per_page: perPage,
        search,
        ...(filterInstituteId ? { institute_id: filterInstituteId } : {}),
        ...(filterCircleId ? { circle_id: filterCircleId } : {}),
      } as any)

      const next =
        (res && Array.isArray((res as any).data) && (res as any).data) ||
        (Array.isArray(res) ? res : [])

      setRows(next as Student[])
      setMeta((res as any)?.meta ?? null)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "تعذر تحميل الطلاب")
    } finally {
      setLoading(false)
    }
  }, [filterCircleId, filterInstituteId, page, perPage, search])

  // Load data when filters change
  useEffect(() => {
    const id = setTimeout(() => load(), 300)
    return () => clearTimeout(id)
  }, [load])

  // ====== Create / Edit / Delete ======
  const onCreate = async (payload: CreateStudentSubmitPayload) => {
    setSubmitting(true)
    try {
      const fromQuery = Number(searchParams.get("institute_id") || "")
      const queryInstituteId = Number.isFinite(fromQuery) && fromQuery > 0 ? fromQuery : null

      const fromOwn = Number(ownInstituteId)
      const ownResolvedInstituteId = Number.isFinite(fromOwn) && fromOwn > 0 ? fromOwn : null

      const fromStorage = Number(localStorage.getItem("institute_id") || "")
      const storageInstituteId = Number.isFinite(fromStorage) && fromStorage > 0 ? fromStorage : null

      const resolvedInstituteId =
        payload.institute_id ??
        filterInstituteId ??
        queryInstituteId ??
        ownResolvedInstituteId ??
        storageInstituteId ??
        undefined

      if (!resolvedInstituteId) {
        toast.error("Institute ID is required")
        setSubmitting(false)
        return
      }

      const circleId = Math.trunc(Number(payload.circle_id))
      if (!Number.isFinite(circleId) || circleId <= 0) {
        toast.error("Circle ID is required")
        setSubmitting(false)
        return
      }

      const levelId = Math.trunc(Number(payload.level_id))
      if (!Number.isFinite(levelId) || levelId <= 0) {
        toast.error("Level ID is required")
        setSubmitting(false)
        return
      }

      if (!payload.email?.trim()) {
        toast.error("Email is required")
        setSubmitting(false)
        return
      }

      if (!payload.password?.trim()) {
        toast.error("Password is required")
        setSubmitting(false)
        return
      }

      const age = Number(payload.age)
      if (!Number.isFinite(age) || age <= 0) {
        toast.error("Age must be a valid number")
        setSubmitting(false)
        return
      }

      const finalPayload = {
        ...payload,
        age,
        institute_id: Number(resolvedInstituteId),
        circle_id: circleId,
        level_id: levelId,
        mobile: String(payload.mobile || "").trim(),
        email: payload.email.trim(),
        password: payload.password,
        status: 1,
      }

      console.log("Final Payload:", finalPayload)

      await createStudent(finalPayload)
      await load()
      setOpenCreate(false)
      toast.success("تمت الإضافة بنجاح")
      nav("/admin/students", { replace: true })
    } catch (e: any) {
      const backendErrors = e?.response?.data?.errors
      if (backendErrors && typeof backendErrors === "object") {
        const firstKey = Object.keys(backendErrors)[0]
        const firstErr = backendErrors[firstKey]
        const message = Array.isArray(firstErr) ? String(firstErr[0] ?? "") : String(firstErr ?? "")
        toast.error(message || e?.response?.data?.message || "فشل الإضافة")
      } else {
        toast.error(e?.response?.data?.message || "فشل الإضافة")
      }
      throw e
    } finally {
      setSubmitting(false)
    }
  }

  const onEdit = async (v: StudentFormValues) => {
    if (!openEdit) return
    setSubmitting(true)
    try {
      const updated = await updateStudent(openEdit.id, v)
      setRows((prev) => prev.map((r) => (r.id === openEdit.id ? updated : r)))
      setOpenEdit(null)
      toast.success("تم التعديل بنجاح")
      nav("/admin/students", { replace: true })
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل التعديل")
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(id: number) {
    if (!confirm("متأكد من حذف هذا الطالب؟")) return
    try {
      await deleteStudent(id)
      setRows((prev) => prev.filter((r) => r.id !== id))
      toast.success("تم الحذف")
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل الحذف")
    }
  }

  // ====== Helpers (display names) ======
  const instName = (id?: number) => instOptions.find((i) => i.id === id)?.name || "اختر المعهد…"
  const circleName = (id?: number) => circleOptions.find((c) => c.id === id)?.name || "اختر الحلقة…"

  const clearFilters = () => {
    // Restricted users stay locked to their own institute
    setFilterInstituteId(isRestricted ? ownInstituteId : undefined)
    setFilterCircleId(undefined)
    setSearch("")
    setPage(1)
  }

  const totalStudents = meta?.total || rows.length
  const activeStudents = rows.filter((s) => s.status === 1).length
  const newStudentsThisMonth = rows.filter((s) => {
    if (!s.created_at) return false
    const created = new Date(s.created_at)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  }).length

  const coverageRate = useMemo(() => {
    const circlesCovered = new Set(rows.map((r) => r.circle_id).filter((id) => id != null)).size
    const totalCircles = circleOptions.length || 1
    return Math.round((circlesCovered / totalCircles) * 100)
  }, [rows, circleOptions])

  function getInitials(name: string): string {
    return (name ?? "")
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "ط"
  }

  function toDisplayText(value: unknown, fallback = "غير محدد") {
    if (value == null) return fallback
    const str = String(value).trim()
    return str.length ? str : fallback
  }

  function parseGender(raw: unknown): "male" | "female" | null {
    if (raw == null || raw === "") return null
    const v = String(raw).toLowerCase().trim()
    if (["male", "m", "1", "ذكر"].includes(v)) return "male"
    if (["female", "f", "0", "أنثى"].includes(v)) return "female"
    return null
  }

  function parseStatus(raw: unknown): number | null {
    if (raw == null || raw === "") return null
    if (typeof raw === "boolean") return raw ? 1 : 0
    const v = String(raw).toLowerCase().trim()
    if (["active", "enabled", "activated", "approved", "on", "true", "yes", "نشط"].includes(v)) return 1
    if (["inactive", "disabled", "deactivated", "off", "false", "no", "غير نشط"].includes(v)) return 0
    if (["pending", "قيد الانتظار"].includes(v)) return 2
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  function ageFromBirthdate(raw: unknown): number | null {
    const txt = String(raw ?? "").trim()
    if (!txt) return null
    const d = new Date(txt)
    if (Number.isNaN(d.getTime())) return null
    const now = new Date()
    let age = now.getFullYear() - d.getFullYear()
    const m = now.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1
    return age >= 0 ? age : null
  }

  function normalizeStudentCardData(student: Student) {
    const s: any = student || {}
    const user = s.user || {}
    const parent = s.parent || {}

    const resolveLevelName = (raw: unknown): string | null => {
      if (raw == null) return null
      if (typeof raw === "object") {
        const obj = raw as Record<string, unknown>
        const nested = obj.name ?? obj.level_name ?? obj.ar_name ?? obj.title ?? obj.label
        if (nested == null) return null
        const nestedText = String(nested).trim()
        return nestedText.length ? nestedText : null
      }
      const text = String(raw).trim()
      return text.length ? text : null
    }

    const resolvedName =
      s.name ??
      s.student_name ??
      user.name ??
      user.full_name ??
      s.full_name ??
      null

    const resolvedGender =
      parseGender(s.gender) ??
      parseGender(s.gender_label) ??
      parseGender(user.gender) ??
      parseGender(user.sex) ??
      null

    const resolvedStatus =
      parseStatus(s.status) ??
      parseStatus(s.state) ??
      parseStatus(s.status_label) ??
      parseStatus(s.status_name) ??
      parseStatus(s.is_active) ??
      parseStatus(s.active) ??
      parseStatus(user.status) ??
      parseStatus(user.status_label) ??
      parseStatus(user.status_name) ??
      parseStatus(user.is_active) ??
      parseStatus(user.active) ??
      2

    const resolvedAge =
      (Number.isFinite(Number(s.age)) ? Number(s.age) : null) ??
      (Number.isFinite(Number(user.age)) ? Number(user.age) : null) ??
      ageFromBirthdate(s.birthdate ?? s.birth_date ?? user.birthdate ?? user.birth_date)

    const resolvedPhone =
      s.phone ??
      s.mobile ??
      s.parent_phone ??
      parent.phone ??
      parent.mobile ??
      user.phone ??
      user.mobile ??
      null

    const resolvedLevel =
      resolveLevelName(s.level) ??
      resolveLevelName(s.level_name) ??
      resolveLevelName(s.academic_level) ??
      resolveLevelName(s.grade) ??
      resolveLevelName(user.level) ??
      resolveLevelName(user.level_name) ??
      null

    const resolvedCircle =
      s.circle?.name ??
      s.circle_name ??
      s.halaqa_name ??
      null

    const avatarSrc =
      s.avatar_url ||
      s.avatar ||
      s.photo ||
      s.image ||
      user.avatar_url ||
      user.avatar ||
      ""

    return {
      name: toDisplayText(resolvedName),
      gender: resolvedGender,
      status: resolvedStatus,
      age: resolvedAge,
      phone: toDisplayText(resolvedPhone),
      level: toDisplayText(resolvedLevel),
      circle: toDisplayText(resolvedCircle),
      avatarSrc,
    }
  }

  function getAvatarRing(student: Student): string {
    const status = normalizeStudentCardData(student).status
    if (status === 1) return "ring-emerald-400/90"
    if (status === 0) return "ring-slate-300"
    return "ring-amber-400/90"
  }

  function getAvatarGradient(student: Student): string {
    const data = normalizeStudentCardData(student)
    if (data.gender === "female") return "from-rose-400 to-fuchsia-600"
    const seed = String(data.name || "A")
    const gradients = [
      "from-emerald-400 to-emerald-600",
      "from-teal-400 to-teal-600",
      "from-blue-400 to-blue-600",
      "from-indigo-400 to-indigo-600",
      "from-cyan-400 to-cyan-600",
    ]
    const index = seed.charCodeAt(0) % gradients.length
    return gradients[index]
  }

  function getStatusBadge(status?: number | null) {
    if (status === 1) {
      return "bg-emerald-100/70 text-emerald-700 border-emerald-200/80 shadow-[0_0_16px_rgba(16,185,129,0.15)]"
    }
    if (status === 0) {
      return "bg-slate-100/70 text-slate-700 border-slate-200/80"
    }
    return "bg-amber-100/70 text-amber-700 border-amber-200/80 shadow-[0_0_16px_rgba(245,158,11,0.15)]"
  }

  function getStatusText(status?: number | null) {
    if (status === 1) return "نشط"
    if (status === 0) return "غير نشط"
    return "قيد الانتظار"
  }

  function getPerformance(student: Student) {
    const raw = Number(
      (student as any)?.performance_index ??
      (student as any)?.progress ??
      (student as any)?.completion_rate ??
      (student as any)?.attendance_rate ??
      NaN,
    )

    if (Number.isFinite(raw) && raw >= 0) {
      return Math.min(100, Math.max(0, Math.round(raw)))
    }

    const fallback = 55 + ((Number(student.id) * 7) % 38)
    return fallback
  }

  // ====== Render ======
  return (
    <div className="space-y-6 tracking-[0.01em]" dir="rtl">
      <LoadingBar active={loading} />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 space-y-6">
        <TenantViewBanner
          instituteId={filterInstituteId}
          instituteName={instOptions.find(i => i.id === filterInstituteId)?.name}
          onClear={() => setFilterInstituteId(undefined)}
        />
        <PageHeader
          title="الطلاب"
          subtitle="دليل الطلاب مع بطاقة أداء وتسكين أكاديمي تفاعلي"
          actions={
            <>
              <Button
                variant="outline"
                onClick={load}
                className="h-11 rounded-2xl border-white/60 bg-white/50 px-4 backdrop-blur-md"
              >
                <RefreshCw className="h-4 w-4" />
                تحديث
              </Button>
              <Button
                className="h-11 rounded-2xl border-0 bg-gradient-to-r from-emerald-500 to-teal-500 px-5 text-white shadow-[0_10px_24px_rgba(16,185,129,0.25)] hover:from-emerald-600 hover:to-teal-600"
                onClick={() => {
                  const next = new URLSearchParams(searchParams)
                  next.set("create", "1")
                  if (filterInstituteId != null) {
                    next.set("institute_id", String(filterInstituteId))
                  }
                  setSearchParams(next, { replace: true })
                  setOpenCreate(true)
                }}
              >
                إضافة طالب
              </Button>
            </>
          }
        />

        {/* Glass Stats with Gradient Borders */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-[26px] bg-gradient-to-br from-blue-500/40 via-indigo-500/25 to-transparent p-[1px]">
          <div className="rounded-[25px] border border-white/60 bg-white/45 p-5 backdrop-blur-md shadow-[0_14px_34px_rgba(37,99,235,0.14)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600">إجمالي الطلاب</p>
                <h3 className="mt-2 text-3xl font-black text-slate-900">{totalStudents}</h3>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-300/50">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[26px] bg-gradient-to-br from-amber-400/45 via-orange-500/28 to-transparent p-[1px]">
          <div className="rounded-[25px] border border-white/60 bg-white/45 p-5 backdrop-blur-md shadow-[0_14px_34px_rgba(245,158,11,0.14)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600">مؤشر التغطية الأكاديمية</p>
                <h3 className="mt-2 text-3xl font-black text-slate-900">{coverageRate}%</h3>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-300/50">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[26px] bg-gradient-to-br from-emerald-400/45 via-teal-500/28 to-transparent p-[1px]">
          <div className="rounded-[25px] border border-white/60 bg-white/45 p-5 backdrop-blur-md shadow-[0_14px_34px_rgba(16,185,129,0.2)] animate-[pulse_2.8s_ease-in-out_infinite]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600">طلاب جدد هذا الشهر</p>
                <h3 className="mt-2 text-3xl font-black text-slate-900">{newStudentsThisMonth}</h3>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-300/60">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Unified Action Bar */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[260px]">
            <label className="block text-xs font-semibold mb-2 text-slate-700">البحث</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="ابحث باسم الطالب أو الهاتف…"
                value={search}
                onChange={(e) => {
                  setPage(1)
                  setSearch(e.target.value)
                }}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            </div>

            {/* Filter: Institute (hidden for institute-admin — locked by guard) */}
            {!isRestricted && <div className="min-w-[220px]">
              <label className="block text-xs font-semibold mb-2 text-slate-700">المعهد</label>
              <Popover open={instOpen} onOpenChange={setInstOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="h-11 w-full justify-between rounded-2xl">
                    {instName(filterInstituteId)}
                    <ChevronsUpDown className="opacity-50 size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="end">
                  <Command>
                    <CommandInput placeholder="ابحث عن معهد…" className="text-right" />
                    <CommandEmpty>لا توجد نتائج.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        key={0}
                        value="الكل"
                        onSelect={() => {
                          setFilterInstituteId(undefined)
                          setFilterCircleId(undefined)
                          setInstOpen(false)
                          setPage(1)
                        }}
                      >
                        <CheckIcon className={cn("ml-2 size-4", !filterInstituteId ? "opacity-100" : "opacity-0")} />
                        الكل
                      </CommandItem>

                      {instOptions.map((i) => (
                        <CommandItem
                          key={i.id}
                          value={i.name}
                          onSelect={() => {
                            setFilterInstituteId(i.id)
                            setInstOpen(false)
                            setPage(1)
                          }}
                        >
                          <CheckIcon className={cn("ml-2 size-4", i.id === filterInstituteId ? "opacity-100" : "opacity-0")} />
                          {i.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>}

            {/* Filter: Circle (depends on institute) */}
            <div className="min-w-[220px]">
              <label className="block text-xs font-semibold mb-2 text-slate-700">الحلقة</label>
              <Popover open={circleOpen} onOpenChange={setCircleOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="h-11 w-full justify-between rounded-2xl"
                    disabled={!filterInstituteId}
                    title={!filterInstituteId ? "اختر المعهد أولاً" : ""}
                  >
                    {circleName(filterCircleId)}
                    <ChevronsUpDown className="opacity-50 size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="end">
                  <Command>
                    <CommandInput placeholder="ابحث عن حلقة…" className="text-right" />
                    <CommandEmpty>لا توجد نتائج.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        key={0}
                        value="الكل"
                        onSelect={() => {
                          setFilterCircleId(undefined)
                          setCircleOpen(false)
                          setPage(1)
                        }}
                      >
                        <CheckIcon className={cn("ml-2 size-4", !filterCircleId ? "opacity-100" : "opacity-0")} />
                        الكل
                      </CommandItem>

                      {circleOptions.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.name}
                          onSelect={() => {
                            setFilterCircleId(c.id)
                            setCircleOpen(false)
                            setPage(1)
                          }}
                        >
                          <CheckIcon className={cn("ml-2 size-4", c.id === filterCircleId ? "opacity-100" : "opacity-0")} />
                          {c.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Button variant="outline" onClick={clearFilters} className="h-11 rounded-2xl px-4">
              مسح الفلاتر
            </Button>

            <div className="ms-auto flex items-center gap-2 flex-wrap">
              <Button onClick={load} variant="outline" className="h-11 rounded-2xl gap-2 px-4">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                تحديث
              </Button>
              <ExportMenu rows={rows} filename="students" buttonClassName="h-11 rounded-2xl px-4" />
            </div>
          </div>
        </div>

        {/* Student Action Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 justify-items-start gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full max-w-[420px] rounded-3xl" />
          ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-8 shadow-xl">
            <EmptyState
              title="لا يوجد طلاب حالياً"
              desc="أضف أول طالب للبدء في إدارة التسكين الأكاديمي."
              actionLabel="إضافة طالب"
              onAction={() => setOpenCreate(true)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 justify-items-start gap-6">
          {rows.map((student) => {
              const view = normalizeStudentCardData(student)
            const performance = getPerformance(student)
            return (
              <div
                key={student.id}
                className="group relative w-full max-w-[420px] justify-self-start overflow-hidden rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.03]"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn("relative h-20 w-20 rounded-full ring-4 shadow-lg overflow-hidden", getAvatarRing(student))}>
                      {view.avatarSrc ? (
                        <img src={view.avatarSrc} alt={view.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className={cn("h-full w-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-2xl", getAvatarGradient(student))}>
                          {getInitials(view.name)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate text-lg">{view.name}</h3>
                    <p className="text-xs text-slate-500">ID: {student.id}</p>
                      <p className="text-xs text-slate-500 mt-1">{view.gender === "female" ? "أنثى" : view.gender === "male" ? "ذكر" : "غير محدد"}</p>
                  </div>

                  <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <MoreVertical size={16} className="text-slate-600" />
                  </button>
                </div>

                <div className="mb-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-sm",
                      getStatusBadge(view.status),
                    )}
                  >
                    {getStatusText(view.status)}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="text-xs font-semibold">العمر:</span>
                    <span className="text-xs">{view.age ?? "غير محدد"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="text-xs font-semibold">الهاتف:</span>
                    <span className="text-xs">{view.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 truncate">
                    <span className="text-xs font-semibold">الحلقة:</span>
                    <span className="truncate text-xs">{view.circle}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="text-xs font-semibold">المستوى:</span>
                    <span className="text-xs">{(student as any)?.level?.name || (student as any)?.level_name || view.level}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">مؤشر الأداء</span>
                    <span className="text-xs font-bold text-emerald-600">{performance}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-teal-600 h-full transition-all duration-500"
                      style={{ width: `${performance}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setOpenEdit(student)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 text-xs font-semibold transition-colors"
                  >
                    <Edit2 size={12} />
                    تعديل
                  </button>
                  <button
                    onClick={() => onDelete(student.id)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 py-2 text-xs font-semibold transition-colors"
                  >
                    <Trash2 size={12} />
                    حذف
                  </button>
                </div>
              </div>
            )
          })}
          </div>
        )}

        {/* Pagination */}
        {meta && rows.length > 0 && (
          <div className="flex items-center justify-between text-sm text-slate-600 rounded-2xl bg-white/60 p-4">
            <div>
              صفحة {meta.current_page || page} من {meta.last_page || 1}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl"
              >
                السابق
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta?.last_page ? page >= meta.last_page : true}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl"
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create */}
      <CreateStudentModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSubmit={onCreate}
        instituteId={filterInstituteId}
      />

      {/* Edit */}
      <ModalFormShell
        open={!!openEdit}
        onClose={() => setOpenEdit(null)}
        title="تعديل طالب"
        formId="student-edit-form"
        submitting={submitting}
      >
        <StudentForm formId="student-edit-form" showActions={false} submitting={submitting} defaultValues={openEdit ?? undefined} onSubmit={onEdit} />
      </ModalFormShell>
    </div>
  )
}
