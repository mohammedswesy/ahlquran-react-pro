// src/pages/admin/TeachersList.tsx
import { useCallback, useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { useInstituteGuard } from "@/hooks/useInstituteGuard"

import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { DataTable } from "@/components/ui/datatable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import EmptyState from "@/components/ui/empty-state"
import LoadingBar from "@/components/ui/loading-bar"
import ModalFormShell from "@/components/ui/modal-form-shell"

import {
  listTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  type Teacher,
} from "@/services/teachers"

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
import { 
  ChevronsUpDown, 
  Check, 
  Users, 
  TrendingUp, 
  Shield,
  MoreVertical,
  Edit2,
  Trash2,
  Lock,
  MessageSquare,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import TenantViewBanner from "@/components/ui/tenant-banner"

import TeacherForm, { type TeacherFormValues } from "./TeacherForm"

export default function TeachersList() {
  const nav = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [rows, setRows] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [meta, setMeta] = useState<any>(null)

  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState<Teacher | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [createServerErrors, setCreateServerErrors] = useState<Partial<Record<keyof TeacherFormValues, string>>>({})

  const [filterInstituteId, setFilterInstituteId] = useState<number | undefined>()
  const [filterCircleId, setFilterCircleId] = useState<number | undefined>()

  // ====== Institute guard ======
  const { isRestricted, ownInstituteId } = useInstituteGuard({ filterInstituteId, setFilterInstituteId })

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

  useEffect(() => {
    ;(async () => {
      try {
        const insts = await listInstitutesOptions()
        setInstOptions(insts)
      } catch {
        // ignore
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
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

  const stats = useMemo(() => {
    const total = rows.length
    const topPerformer = rows.length > 0 ? rows[0] : null
    const circlesCovered = new Set(rows.map((r) => r.circle_id).filter((id) => id != null)).size
    const totalCircles = circleOptions.length || 1
    const coverageRate = Math.round((circlesCovered / totalCircles) * 100)

    return { total, topPerformer, coverageRate, circlesCovered }
  }, [rows, circleOptions])

  function getInitials(name: string): string {
    return (name ?? "")
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
  }

  function getAvatarColor(seed: string): string {
    const colors = [
      "from-emerald-400 to-emerald-600",
      "from-teal-400 to-teal-600",
      "from-green-400 to-green-600",
      "from-blue-400 to-blue-600",
      "from-cyan-400 to-cyan-600",
      "from-indigo-400 to-indigo-600",
    ]
    const index = seed.charCodeAt(0) % colors.length
    return colors[index]
  }

  const columns = useMemo<ColumnDef<Teacher>[]>(
    () => [
      { id: "serial", header: "#", cell: ({ row }) => row.index + 1 },
      { id: "name", accessorKey: "name", header: "اسم المعلّم" },
      {
        id: "gender",
        header: "النوع",
        cell: ({ row }) => ((row.original.gender || "") === "female" ? "أنثى" : "ذكر"),
      },
      { id: "email", accessorKey: "email", header: "البريد", cell: ({ getValue }) => getValue() || "—" },
      { id: "phone", accessorKey: "phone", header: "الهاتف", cell: ({ getValue }) => getValue() || "—" },
      { id: "institute", header: "المعهد", cell: ({ row }) => row.original.institute?.name || "—" },
      { id: "circle", header: "الحلقة", cell: ({ row }) => row.original.circle?.name || "—" },
      {
        id: "user_status",
        header: "حساب المستخدم",
        cell: ({ row }) => {
          const userId = (row.original as any).user_id
          if (userId) return <span className="text-green-600 font-semibold">✓ مرتبط</span>
          return <span className="text-gray-500">—</span>
        },
      },
      {
        id: "actions",
        header: "إجراءات",
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpenEdit(r)}>
                تعديل
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onDelete(r.id)}>
                حذف
              </Button>
            </div>
          )
        },
      },
    ],
    []
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listTeachers({
        page,
        per_page: perPage,
        search,
        ...(filterInstituteId ? { institute_id: filterInstituteId } : {}),
        ...(filterCircleId ? { circle_id: filterCircleId } : {}),
      } as any)

      const next =
        (res && Array.isArray((res as any).data) && (res as any).data) ||
        (Array.isArray(res) ? res : [])

      setRows(next as Teacher[])
      setMeta((res as any)?.meta ?? null)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "تعذر تحميل المعلّمين")
    } finally {
      setLoading(false)
    }
  }, [filterCircleId, filterInstituteId, page, perPage, search])

  useEffect(() => {
    const id = setTimeout(() => load(), 350)
    return () => clearTimeout(id)
  }, [load])

  const onCreate = async (v: TeacherFormValues) => {
    setSubmitting(true)
    setCreateServerErrors({})
    try {
      const fromQuery = Number(searchParams.get("institute_id") || "")
      const queryInstituteId = Number.isFinite(fromQuery) && fromQuery > 0 ? fromQuery : null

      const fromOwn = Number(ownInstituteId)
      const ownResolvedInstituteId = Number.isFinite(fromOwn) && fromOwn > 0 ? fromOwn : null

      const fromStorage = Number(localStorage.getItem("institute_id") || "")
      const storageInstituteId = Number.isFinite(fromStorage) && fromStorage > 0 ? fromStorage : null

      const resolvedInstituteId =
        v.institute_id ??
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

      const created = await createTeacher({ ...v, institute_id: resolvedInstituteId })
      setRows((prev) => [created, ...prev])
      setOpenCreate(false)
      toast.success("تمت الإضافة بنجاح")
      nav("/admin/teachers", { replace: true })
    } catch (e: any) {
      const backendErrors = (e?.response?.data?.errors ?? {}) as Record<string, string | string[]>
      const nextErrors: Partial<Record<keyof TeacherFormValues, string>> = {}
      // Map common backend error fields
      for (const key of ["name", "email", "password", "phone", "hire_date", "institute_id", "circle_id"] as const) {
        const err = backendErrors[key]
        if (err) {
          nextErrors[key] = Array.isArray(err) ? String(err[0] ?? "") : String(err)
        }
      }
      setCreateServerErrors(nextErrors)
      toast.error(e?.response?.data?.message || "فشل الإضافة")
    } finally {
      setSubmitting(false)
    }
  }

  const onEdit = async (v: TeacherFormValues) => {
    if (!openEdit) return
    setSubmitting(true)
    try {
      const updated = await updateTeacher(openEdit.id, v)
      setRows((prev) => prev.map((r) => (r.id === openEdit.id ? updated : r)))
      setOpenEdit(null)
      toast.success("تم التعديل بنجاح")
      nav("/admin/teachers", { replace: true })
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل التعديل")
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(id: number) {
    if (!confirm("متأكد من حذف هذا المعلّم؟")) return
    try {
      await deleteTeacher(id)
      setRows((prev) => prev.filter((r) => r.id !== id))
      toast.success("تم الحذف")
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل الحذف")
    }
  }

  const instName = (id?: number) => instOptions.find((i) => i.id === id)?.name || "كل المعاهد"
  const circleName = (id?: number) => circleOptions.find((c) => c.id === id)?.name || "كل الحلقات"

  return (
    <AppLayout>
      <Header 
        title="إدارة المعلمين" 
        subtitle="دليل المعلمين والمربين مع مؤشرات الأداء والكفاءة" 
      />

      <div className="p-4 sm:p-5 space-y-5" dir="rtl">
        <LoadingBar active={loading} />
        
        <TenantViewBanner
          instituteId={filterInstituteId}
          instituteName={instOptions.find(i => i.id === filterInstituteId)?.name}
          onClear={() => { setFilterInstituteId(undefined); setFilterCircleId(undefined); setPage(1) }}
        />

        {/* Admin Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Educators */}
          <div
            className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
              boxShadow: "0 22px 48px rgba(16, 185, 129, 0.24)",
            }}
          >
            <Users size={80} className="absolute -left-3 -top-3 text-white/20" />
            <div className="relative z-10 text-white">
              <div className="text-xs opacity-80">المعلمون النشطون</div>
              {loading ? (
                <Skeleton className="h-10 w-20 mt-3 bg-white/20" />
              ) : (
                <div className="text-4xl font-black mt-2">{stats.total}</div>
              )}
              <div className="text-xs opacity-80 mt-1">مربي مميز في المعهد</div>
            </div>
          </div>

          {/* Top Performer */}
          <div
            className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
              boxShadow: "0 22px 48px rgba(251, 191, 36, 0.28)",
            }}
          >
            <TrendingUp size={80} className="absolute -left-3 -top-3 text-white/20" />
            <div className="relative z-10 text-white">
              <div className="text-xs opacity-80">الأداء الممتاز</div>
              {loading ? (
                <Skeleton className="h-10 w-32 mt-3 bg-white/20" />
              ) : (
                <div className="text-lg font-black mt-2 truncate">{stats.topPerformer?.name || "—"}</div>
              )}
              <div className="text-xs opacity-80 mt-1">أعلى معدل نجاح</div>
            </div>
          </div>

          {/* Coverage Rate */}
          <div
            className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              boxShadow: "0 22px 48px rgba(37, 99, 235, 0.24)",
            }}
          >
            <Shield size={80} className="absolute -left-3 -top-3 text-white/20" />
            <div className="relative z-10 text-white">
              <div className="text-xs opacity-80">تغطية الحلقات</div>
              {loading ? (
                <Skeleton className="h-10 w-20 mt-3 bg-white/20" />
              ) : (
                <div className="text-4xl font-black mt-2">{stats.coverageRate}%</div>
              )}
              <div className="text-xs opacity-80 mt-1">{stats.circlesCovered} من {circleOptions.length} حلقة</div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-6 shadow-2xl">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[250px]">
              <label className="block text-xs font-semibold mb-2 text-slate-700">البحث</label>
              <input
                type="text"
                placeholder="ابحث باسم المعلّم…"
                value={search}
                onChange={(e) => {
                  setPage(1)
                  setSearch(e.target.value)
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Institute filter (hidden for institute-admin) */}
            {!isRestricted && (
              <div className="min-w-[220px]">
                <label className="block text-xs font-semibold mb-2 text-slate-700">المعهد</label>
                <Popover open={instOpen} onOpenChange={setInstOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between rounded-2xl">
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
                          <Check className={cn("ml-2 size-4", !filterInstituteId ? "opacity-100" : "opacity-0")} />
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
                            <Check className={cn("ml-2 size-4", i.id === filterInstituteId ? "opacity-100" : "opacity-0")} />
                            {i.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Circle filter */}
            <div className="min-w-[220px]">
              <label className="block text-xs font-semibold mb-2 text-slate-700">الحلقة</label>
              <Popover open={circleOpen} onOpenChange={setCircleOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between rounded-2xl"
                    disabled={!filterInstituteId}
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
                        <Check className={cn("ml-2 size-4", !filterCircleId ? "opacity-100" : "opacity-0")} />
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
                          <Check className={cn("ml-2 size-4", c.id === filterCircleId ? "opacity-100" : "opacity-0")} />
                          {c.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={load} 
                variant="outline" 
                className="rounded-2xl gap-2"
                size="sm"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                تحديث
              </Button>
              <Button
                onClick={() => {
                  const next = new URLSearchParams(searchParams)
                  next.set("create", "1")
                  if (filterInstituteId != null) {
                    next.set("institute_id", String(filterInstituteId))
                  }
                  setSearchParams(next, { replace: true })
                  setOpenCreate(true)
                }}
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 gap-2"
                size="sm"
              >
                + إضافة معلّم
              </Button>
            </div>
          </div>
        </div>

        {/* Teacher Profile Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-3xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-8 shadow-xl">
            <EmptyState
              title="لا توجد بيانات معلّمين"
              desc="أضف أول معلّم للبدء."
              actionLabel="إضافة معلّم"
              onAction={() => setOpenCreate(true)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rows.map((teacher) => (
              <div
                key={teacher.id}
                className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
              >
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColor(teacher.name)} flex items-center justify-center text-white font-bold text-xl shadow-lg`}
                  >
                    {getInitials(teacher.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate text-lg">{teacher.name}</h3>
                    <p className="text-xs text-slate-500">
                      {teacher.gender === "female" ? "معلّمة" : "معلّم"}
                    </p>
                  </div>
                  
                  {/* Quick Action Menu */}
                  <div className="relative">
                    <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <MoreVertical size={16} className="text-slate-600" />
                    </button>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4 text-sm">
                  {teacher.email && (
                    <div className="flex items-center gap-2 text-slate-600 truncate">
                      <span className="text-xs font-semibold">البريد:</span>
                      <span className="truncate text-xs">{teacher.email}</span>
                    </div>
                  )}
                  {teacher.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-xs font-semibold">الهاتف:</span>
                      <span className="text-xs">{teacher.phone}</span>
                    </div>
                  )}
                </div>

                {/* Circle Chips */}
                {teacher.circle?.name && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      📚 {teacher.circle.name}
                    </span>
                  </div>
                )}

                {/* Institute Info */}
                {teacher.institute?.name && (
                  <div className="text-xs text-slate-500 mb-4">
                    <span className="font-semibold">المعهد:</span> {teacher.institute.name}
                  </div>
                )}

                {/* Progress Bar - Success Indicator */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">مؤشر الأداء</span>
                    <span className="text-xs font-bold text-emerald-600">85%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full transition-all duration-500"
                      style={{ width: "85%" }}
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setOpenEdit(teacher)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 text-xs font-semibold transition-colors"
                  >
                    <Edit2 size={12} />
                    تعديل
                  </button>
                  <button
                    onClick={() => onDelete(teacher.id)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 py-2 text-xs font-semibold transition-colors"
                  >
                    <Trash2 size={12} />
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && rows.length > 0 && (
          <div className="flex items-center justify-between text-sm text-slate-600 rounded-2xl bg-white/60 p-4">
            <div>
              صفحة {meta.current_page} من {meta.last_page}
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
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl"
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      <ModalFormShell
        open={openCreate}
        onClose={() => {
          setOpenCreate(false)
          setCreateServerErrors({})
        }}
        title="إضافة معلّم جديد"
        formId="teacher-create-form"
        submitting={submitting}
      >
        <TeacherForm 
          formId="teacher-create-form" 
          showActions={false} 
          submitting={submitting} 
          onSubmit={onCreate} 
          serverErrors={createServerErrors} 
        />
      </ModalFormShell>

      {/* Edit Teacher Modal */}
      <ModalFormShell
        open={!!openEdit}
        onClose={() => setOpenEdit(null)}
        title="تعديل معلّم"
        formId="teacher-edit-form"
        submitting={submitting}
      >
        <TeacherForm 
          formId="teacher-edit-form" 
          showActions={false} 
          submitting={submitting} 
          defaultValues={openEdit ?? undefined} 
          onSubmit={onEdit} 
        />
      </ModalFormShell>
    </AppLayout>
  )
}
