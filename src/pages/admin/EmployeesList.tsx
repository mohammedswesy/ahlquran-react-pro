// src/pages/admin/EmployeesList.tsx
import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import {
  listEmployees,
  updateEmployee,
  deleteEmployee,
  type Employee,
} from "@/services/employees"
import { listInstitutesOptions } from "@/services/institutes"

import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import LoadingBar from "@/components/ui/loading-bar"
import { Skeleton } from "@/components/ui/skeleton"
import ModalFormShell from "@/components/ui/modal-form-shell"
import AddEmployeeModal from "@/components/app/AddEmployeeModal"
import EmployeeForm, { type EmployeeFormValues } from "./EmployeeForm"

import {
  Users,
  ShieldCheck,
  BarChart3,
  Search,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  UserCircle2,
  ChevronRight,
  ChevronLeft,
  Building2,
} from "lucide-react"

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  admin: "مشرف",
  teacher: "معلّم",
  staff: "موظّف",
}

const ROLE_STYLE: Record<string, string> = {
  admin:   "bg-indigo-100 text-indigo-700 border border-indigo-200",
  teacher: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  staff:   "bg-slate-100  text-slate-600  border border-slate-200",
}

const AVATAR_GRADIENTS = [
  "from-indigo-400 to-indigo-600",
  "from-emerald-400 to-emerald-600",
  "from-violet-400 to-violet-600",
  "from-amber-400  to-amber-600",
  "from-cyan-400   to-cyan-600",
  "from-rose-400   to-rose-600",
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return (name ?? "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("")
}

function avatarGradient(seed: string): string {
  return AVATAR_GRADIENTS[(seed?.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length]
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EmployeesList() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [rows, setRows]       = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta]       = useState<any>(null)

  const [search,   setSearch]   = useState("")
  const [page,     setPage]     = useState(1)
  const [perPage]               = useState(15)

  const [filterRole,        setFilterRole]        = useState<string | undefined>()
  const [filterInstituteId, setFilterInstituteId] = useState<number | undefined>()

  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit,   setOpenEdit]   = useState<Employee | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // kept for edit modal error state
  const [, setCreateServerErrors] = useState<Partial<Record<keyof EmployeeFormValues, string>>>({})

  const [instOptions, setInstOptions] = useState<Array<{ id: number; name: string }>>([])

  // ── bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      try { setInstOptions(await listInstitutesOptions()) } catch { /* ignore */ }
    })()
  }, [])

  useEffect(() => {
    if (searchParams.get("create") !== "1") return
    setOpenCreate(true)
    const next = new URLSearchParams(searchParams)
    next.delete("create")
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  // ── data ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listEmployees({
        page,
        per_page: perPage,
        search,
        ...(filterRole        ? { role: filterRole }               : {}),
        ...(filterInstituteId ? { institute_id: filterInstituteId } : {}),
      } as any)

      const next =
        Array.isArray((res as any)?.data) ? (res as any).data :
        Array.isArray(res)                 ? res                 : []

      setRows(next as Employee[])
      setMeta((res as any)?.meta ?? null)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "تعذر تحميل الموظفين")
    } finally {
      setLoading(false)
    }
  }, [filterInstituteId, filterRole, page, perPage, search])

  useEffect(() => {
    const id = setTimeout(() => load(), 350)
    return () => clearTimeout(id)
  }, [load])

  // ── stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total  = meta?.total ?? rows.length
    const linked = rows.filter((r) => !!(r as any).user_id).length
    const byRole = rows.reduce<Record<string, number>>((acc, r) => {
      const key = (r as any).role || (r as any).role_name || "staff"
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})
    return { total, linked, byRole }
  }, [rows, meta])

  // ── actions ────────────────────────────────────────────────────────────────
  const handleCreateSuccess = () => { setOpenCreate(false); load() }

  const onEdit = async (v: EmployeeFormValues) => {
    if (!openEdit) return
    setSubmitting(true)
    try {
      const updated = await updateEmployee(openEdit.id, v)
      setRows((prev) => prev.map((r) => (r.id === openEdit.id ? (updated as any) : r)))
      setOpenEdit(null)
      toast.success("تم التعديل بنجاح")
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل التعديل")
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(id: number) {
    if (!confirm("متأكد من حذف هذا الموظف؟")) return
    try {
      await deleteEmployee(id)
      setRows((prev) => prev.filter((r) => r.id !== id))
      toast.success("تم الحذف")
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل الحذف")
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <Header
        title="دليل الموظفين"
        subtitle="إدارة الكوادر البشرية والأدوار الوظيفية بكفاءة عالية"
      />

      <div className="p-4 sm:p-6 space-y-6" dir="rtl">
        <LoadingBar active={loading} />

        {/* ── Stats Bar ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Total Staff */}
          <div
            className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:scale-105 cursor-default"
            style={{
              background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)",
              boxShadow: "0 22px 48px rgba(99,102,241,.30)",
            }}
          >
            <Users size={80} className="absolute -left-4 -top-4 text-white/20" />
            <div className="relative z-10 text-white">
              <div className="text-xs font-semibold opacity-80 tracking-wide">إجمالي الموظفين</div>
              {loading
                ? <Skeleton className="h-10 w-20 mt-3 bg-white/20" />
                : <div className="text-5xl font-black mt-2 tabular-nums">{stats.total}</div>
              }
              <div className="text-xs opacity-70 mt-1">كوادر بشرية مسجّلة</div>
            </div>
          </div>

          {/* Linked Accounts */}
          <div
            className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:scale-105 cursor-default"
            style={{
              background: "linear-gradient(135deg,#059669 0%,#10b981 100%)",
              boxShadow: "0 22px 48px rgba(16,185,129,.28)",
            }}
          >
            <ShieldCheck size={80} className="absolute -left-4 -top-4 text-white/20" />
            <div className="relative z-10 text-white">
              <div className="text-xs font-semibold opacity-80 tracking-wide">حسابات مرتبطة</div>
              {loading
                ? <Skeleton className="h-10 w-20 mt-3 bg-white/20" />
                : <div className="text-5xl font-black mt-2 tabular-nums">{stats.linked}</div>
              }
              <div className="text-xs opacity-70 mt-1">موظف مفعّل في النظام</div>
            </div>
          </div>

          {/* Role Breakdown */}
          <div
            className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:scale-105 cursor-default"
            style={{
              background: "linear-gradient(135deg,#f59e0b 0%,#fbbf24 100%)",
              boxShadow: "0 22px 48px rgba(251,191,36,.28)",
            }}
          >
            <BarChart3 size={80} className="absolute -left-4 -top-4 text-white/20" />
            <div className="relative z-10 text-white">
              <div className="text-xs font-semibold opacity-80 tracking-wide">توزيع الأدوار</div>
              {loading
                ? <Skeleton className="h-10 w-36 mt-3 bg-white/20" />
                : (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Object.entries(stats.byRole).map(([r, count]) => (
                      <span key={r} className="rounded-full bg-white/25 px-3 py-1 text-xs font-bold">
                        {ROLE_LABEL[r] || r}: {count}
                      </span>
                    ))}
                    {Object.keys(stats.byRole).length === 0 && (
                      <span className="text-2xl font-black">—</span>
                    )}
                  </div>
                )
              }
              <div className="text-xs opacity-70 mt-2">مشرفون · معلّمون · موظفون</div>
            </div>
          </div>
        </div>

        {/* ── Filter Bar ───────────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-5 shadow-xl">
          <div className="flex flex-wrap gap-3 items-end">

            {/* Search */}
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-semibold mb-2 text-slate-600">البحث</label>
              <div className="relative">
                <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث باسم الموظف أو بريده…"
                  value={search}
                  onChange={(e) => { setPage(1); setSearch(e.target.value) }}
                  className="w-full rounded-2xl border border-slate-200 bg-white pr-9 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                />
              </div>
            </div>

            {/* Role filter */}
            <div className="min-w-[160px]">
              <label className="block text-xs font-semibold mb-2 text-slate-600">الدور</label>
              <select
                value={filterRole ?? ""}
                onChange={(e) => { setFilterRole(e.target.value || undefined); setPage(1) }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              >
                <option value="">الكل</option>
                <option value="admin">مشرف</option>
                <option value="teacher">معلّم</option>
                <option value="staff">موظّف</option>
              </select>
            </div>

            {/* Institute filter */}
            <div className="min-w-[200px]">
              <label className="block text-xs font-semibold mb-2 text-slate-600">المعهد</label>
              <select
                value={filterInstituteId ?? ""}
                onChange={(e) => { setFilterInstituteId(e.target.value ? Number(e.target.value) : undefined); setPage(1) }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              >
                <option value="">كل المعاهد</option>
                {instOptions.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={load}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              تحديث
            </button>

            {/* Add Employee — gradient + pulsing glow */}
            <button
              onClick={() => setOpenCreate(true)}
              className="relative flex items-center gap-2 rounded-2xl px-5 py-2 text-sm font-bold text-white transition-all duration-300 hover:scale-105"
              style={{
                background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 60%,#06b6d4 100%)",
              }}
            >
              <Plus size={16} />
              إضافة موظف
            </button>
          </div>
        </div>

        {/* ── Employee Ledger ──────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-2xl overflow-hidden">

          {/* Table header */}
          <div className="grid grid-cols-[2rem_1fr_7rem_8rem_7rem_6rem] items-center gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
            <span className="text-center">#</span>
            <span>الموظف</span>
            <span className="text-center hidden sm:block">الدور</span>
            <span className="hidden md:block">المعهد</span>
            <span className="text-center hidden lg:block">الحساب</span>
            <span className="text-center">إجراءات</span>
          </div>

          {/* Loading skeletons */}
          {loading && rows.length === 0 && (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[2rem_1fr_7rem_8rem_7rem_6rem] items-center gap-4 px-6 py-4">
                  <Skeleton className="w-6 h-4 rounded mx-auto" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="w-32 h-3.5 rounded" />
                      <Skeleton className="w-44 h-3 rounded" />
                    </div>
                  </div>
                  <Skeleton className="w-16 h-6 rounded-full hidden sm:block mx-auto" />
                  <Skeleton className="w-24 h-4 rounded hidden md:block" />
                  <Skeleton className="w-16 h-6 rounded-full hidden lg:block mx-auto" />
                  <Skeleton className="w-16 h-8 rounded-xl mx-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && rows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100">
                <UserCircle2 size={48} className="text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-700">لا يوجد موظفون</p>
                <p className="text-sm text-slate-400 mt-1">ابدأ بإضافة موظف جديد إلى دليل الكوادر البشرية</p>
              </div>
              <button
                onClick={() => setOpenCreate(true)}
                className="mt-2 flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition"
              >
                <Plus size={16} />
                إضافة موظف جديد
              </button>
            </div>
          )}

          {/* Data rows */}
          {rows.length > 0 && (
            <div className="divide-y divide-slate-100">
              {rows.map((emp, idx) => {
                const displayName   = (emp as any).user?.name  || emp.name  || "—"
                const displayEmail  = (emp as any).user?.email || emp.email || "—"
                const role          = (emp as any).role || (emp as any).role_name || ""
                const userId        = (emp as any).user_id
                const instituteName = emp.institute?.name || "—"

                return (
                  <div
                    key={emp.id}
                    className="group grid grid-cols-[2rem_1fr_7rem_8rem_7rem_6rem] items-center gap-4 px-6 py-4 transition-all duration-200 hover:bg-indigo-50/40"
                  >
                    {/* Index */}
                    <span className="text-center text-xs text-slate-400 font-mono tabular-nums">
                      {(page - 1) * perPage + idx + 1}
                    </span>

                    {/* Avatar + Name + Email */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(displayName)} flex items-center justify-center text-white text-sm font-bold shadow-md`}
                      >
                        {getInitials(displayName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{displayName}</p>
                        <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
                        {emp.job_title && (
                          <p className="text-xs text-indigo-500 font-medium truncate">{emp.job_title}</p>
                        )}
                      </div>
                    </div>

                    {/* Role badge */}
                    <div className="hidden sm:flex justify-center">
                      {role ? (
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${ROLE_STYLE[role] ?? ROLE_STYLE.staff}`}>
                          {ROLE_LABEL[role] || role}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </div>

                    {/* Institute */}
                    <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
                      <Building2 size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">{instituteName}</span>
                    </div>

                    {/* Account status */}
                    <div className="hidden lg:flex justify-center">
                      {userId ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                          مرتبط
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-400 border border-slate-200">
                          غير مرتبط
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => setOpenEdit(emp)}
                        title="تعديل"
                        className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(emp.id)}
                        title="حذف"
                        className="flex items-center justify-center w-8 h-8 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {meta && (
          <div className="rounded-3xl border border-white/60 bg-white/60 backdrop-blur-xl px-6 py-4 shadow flex flex-wrap items-center justify-between gap-4 text-sm text-slate-600">
            <span>
              صفحة <strong>{meta.current_page}</strong> من <strong>{meta.last_page}</strong>
              {meta.total != null && (
                <span className="text-slate-400 mr-2">· {meta.total} موظف</span>
              )}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50 transition"
              >
                <ChevronRight size={14} />
                السابق
              </button>
              <button
                disabled={meta && page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50 transition"
              >
                التالي
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── Modals ────────────────────────────────────────────────────────── */}
        <AddEmployeeModal
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onSuccess={handleCreateSuccess}
        />

        <ModalFormShell
          open={!!openEdit}
          onClose={() => setOpenEdit(null)}
          title="تعديل موظف"
          formId="employee-edit-form"
          submitting={submitting}
        >
          <EmployeeForm
            formId="employee-edit-form"
            showActions={false}
            submitting={submitting}
            defaultValues={openEdit ?? undefined}
            onSubmit={onEdit}
          />
        </ModalFormShell>
      </div>
    </AppLayout>
  )
}
