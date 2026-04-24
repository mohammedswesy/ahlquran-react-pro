// src/pages/super-admin/Subscriptions.tsx
import { useCallback, useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import {
  PiCurrencyDollarBold,
  PiBuildingsBold,
  PiCalendarCheckBold,
  PiWarningBold,
} from "react-icons/pi"

import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import LoadingBar from "@/components/ui/loading-bar"
import SkeletonTable from "@/components/ui/skeleton-table"
import EmptyState from "@/components/ui/empty-state"
import ModalFormShell from "@/components/ui/modal-form-shell"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

import {
  listSubscriptions,
  getSubscriptionStats,
  listSubscriptionPayments,
  updateSubscription,
  type InstituteSubscription,
  type SubscriptionPayment,
  type SubscriptionStats,
  type SubscriptionPlan,
} from "@/services/institutes"

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────
function planLabel(plan: SubscriptionPlan): string {
  return plan === "free" ? "مجاني" : plan === "pro" ? "Pro" : "Enterprise"
}

function planBadge(plan: SubscriptionPlan) {
  const map: Record<SubscriptionPlan, "muted" | "success" | "primary"> = {
    free: "muted",
    pro: "success",
    enterprise: "primary",
  }
  return <Badge variant={map[plan] ?? "muted"}>{planLabel(plan)}</Badge>
}

function statusBadge(status: string) {
  if (status === "active") return <Badge variant="success">نشط</Badge>
  if (status === "trial") return <Badge variant="warning">تجريبي</Badge>
  if (status === "expired") return <Badge variant="destructive">منتهي</Badge>
  if (status === "suspended") return <Badge variant="secondary">موقوف</Badge>
  return <Badge variant="outline">{status}</Badge>
}

function fmtDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })
}

function fmtAmount(amount: number) {
  return amount.toLocaleString("ar-SA") + " ر.س"
}

// ──────────────────────────────────────────────────────────
// Quick Stat Card
// ──────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color = "brand",
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color?: "brand" | "green" | "amber"
}) {
  const colorMap = {
    brand: { bg: "rgba(0,61,53,.08)", icon: "var(--brand)" },
    green: { bg: "rgba(16,185,129,.1)", icon: "#059669" },
    amber: { bg: "rgba(245,158,11,.1)", icon: "#d97706" },
  }
  const c = colorMap[color]
  return (
    <div
      className="rounded-xl border p-5 flex items-center gap-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ background: c.bg, color: c.icon }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>
          {label}
        </p>
        <p className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>
          {value}
        </p>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Edit Subscription Form
// ──────────────────────────────────────────────────────────
type EditFormState = {
  plan: SubscriptionPlan
  expiry_date: string
  monthly_fee: string
}

function EditSubscriptionForm({
  formId,
  initial,
  onSubmit,
  submitting,
}: {
  formId: string
  initial: InstituteSubscription
  onSubmit: (values: EditFormState) => void
  submitting: boolean
}) {
  const [plan, setPlan] = useState<SubscriptionPlan>(initial.plan)
  const [expiryDate, setExpiryDate] = useState(initial.expiry_date?.slice(0, 10) ?? "")
  const [fee, setFee] = useState(String(initial.monthly_fee ?? ""))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ plan, expiry_date: expiryDate, monthly_fee: fee })
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
          المعهد
        </label>
        <p className="text-sm font-semibold px-3 py-2 rounded-lg border" style={{ background: "var(--surface2)", borderColor: "var(--border)", color: "var(--text)" }}>
          {initial.institute_name}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
          نوع الخطة
        </label>
        <Select value={plan} onValueChange={(v) => setPlan(v as SubscriptionPlan)} disabled={submitting}>
          <SelectTrigger>
            <SelectValue placeholder="اختر الخطة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">مجاني</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
          تاريخ انتهاء الاشتراك
        </label>
        <input
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          disabled={submitting}
          className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-[var(--brand)]"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
          الرسوم الشهرية (ر.س)
        </label>
        <Input
          type="number"
          min={0}
          step={0.01}
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          disabled={submitting}
        />
      </div>
    </form>
  )
}

// ──────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────
export default function Subscriptions() {
  const [subs, setSubs] = useState<InstituteSubscription[]>([])
  const [payments, setPayments] = useState<SubscriptionPayment[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<InstituteSubscription | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [subsRes, paymentsRes, statsRes] = await Promise.allSettled([
        listSubscriptions(),
        listSubscriptionPayments(),
        getSubscriptionStats(),
      ])
      if (subsRes.status === "fulfilled") setSubs(subsRes.value)
      if (paymentsRes.status === "fulfilled") setPayments(paymentsRes.value)
      if (statsRes.status === "fulfilled") setStats(statsRes.value)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "تعذر تحميل بيانات الاشتراكات")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleEditSubmit = async (values: EditFormState) => {
    if (!editTarget) return
    setSubmitting(true)
    try {
      const updated = await updateSubscription(editTarget.institute_id, {
        plan: values.plan,
        expiry_date: values.expiry_date || null,
        monthly_fee: values.monthly_fee ? Number(values.monthly_fee) : undefined,
      })
      setSubs((prev) => prev.map((s) => (s.institute_id === editTarget.institute_id ? { ...s, ...updated } : s)))
      setEditTarget(null)
      toast.success("تم تحديث الاشتراك بنجاح")
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل تحديث الاشتراك")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Subscriptions table columns ──
  const subColumns = useMemo<ColumnDef<InstituteSubscription>[]>(
    () => [
      { id: "idx", header: "#", cell: ({ row }) => row.index + 1 },
      { accessorKey: "institute_name", header: "اسم المعهد" },
      {
        id: "plan",
        header: "نوع الخطة",
        cell: ({ row }) => planBadge(row.original.plan),
      },
      {
        id: "status",
        header: "الحالة",
        cell: ({ row }) => statusBadge(row.original.status),
      },
      {
        id: "expiry",
        header: "تاريخ الانتهاء",
        cell: ({ row }) => {
          const d = row.original.expiry_date
          if (!d) return <span className="text-[var(--muted)]">—</span>
          const isExpired = new Date(d) < new Date()
          return (
            <span className={isExpired ? "text-red-600 font-semibold" : ""}>
              {fmtDate(d)}
            </span>
          )
        },
      },
      {
        id: "fee",
        header: "الرسوم الشهرية",
        cell: ({ row }) => fmtAmount(row.original.monthly_fee),
      },
      {
        id: "students",
        header: "الطلاب",
        cell: ({ row }) => row.original.students_count ?? "—",
      },
      {
        id: "actions",
        header: "إجراءات",
        cell: ({ row }) => (
          <Button size="sm" variant="outline" onClick={() => setEditTarget(row.original)}>
            تعديل الاشتراك
          </Button>
        ),
      },
    ],
    []
  )

  // ── Payments table columns ──
  const payColumns = useMemo<ColumnDef<SubscriptionPayment>[]>(
    () => [
      { id: "idx", header: "#", cell: ({ row }) => row.index + 1 },
      { accessorKey: "institute_name", header: "المعهد" },
      {
        id: "amount",
        header: "المبلغ",
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-700">{fmtAmount(row.original.amount)}</span>
        ),
      },
      {
        id: "date",
        header: "تاريخ الدفع",
        cell: ({ row }) => fmtDate(row.original.payment_date),
      },
      { accessorKey: "method", header: "طريقة الدفع" },
      {
        id: "ref",
        header: "المرجع",
        cell: ({ row }) => row.original.reference || <span className="text-[var(--muted)]">—</span>,
      },
    ],
    []
  )

  return (
    <AppLayout>
      <Header title="إدارة الاشتراكات" subtitle="مراقبة وتحديث اشتراكات المعاهد" />
      <LoadingBar active={loading} />

      <div className="space-y-6" dir="rtl">
        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={<PiCurrencyDollarBold />}
            label="إجمالي الإيرادات الشهرية"
            value={stats ? fmtAmount(stats.total_monthly_revenue) : "—"}
            color="brand"
          />
          <StatCard
            icon={<PiBuildingsBold />}
            label="المعاهد النشطة"
            value={stats?.total_active_institutes ?? "—"}
            color="green"
          />
          <StatCard
            icon={<PiCalendarCheckBold />}
            label="تجديدات قادمة (30 يوم)"
            value={stats?.upcoming_renewals ?? "—"}
            color="amber"
          />
        </div>

        {/* ── Institutes Subscriptions Table ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>اشتراكات المعاهد</CardTitle>
              <Button variant="outline" size="sm" onClick={load}>
                تحديث
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonTable rows={6} cols={8} />
            ) : subs.length === 0 ? (
              <EmptyState
                title="لا توجد اشتراكات مسجلة"
                desc="لم يتم العثور على أي بيانات اشتراكات حتى الآن."
                icon={PiWarningBold as any}
              />
            ) : (
              <DataTable columns={subColumns} data={subs} isLoading={false} searchKey="institute_name" searchPlaceholder="ابحث عن معهد..." />
            )}
          </CardContent>
        </Card>

        {/* ── Payment History ── */}
        <Card>
          <CardHeader>
            <CardTitle>سجل المدفوعات</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonTable rows={5} cols={6} />
            ) : payments.length === 0 ? (
              <EmptyState
                title="لا توجد مدفوعات مسجلة"
                desc="لم يتم تسجيل أي مدفوعات حتى الآن."
              />
            ) : (
              <DataTable columns={payColumns} data={payments} isLoading={false} searchKey="institute_name" searchPlaceholder="ابحث عن معهد..." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Edit Subscription Modal ── */}
      <ModalFormShell
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="تعديل الاشتراك"
        formId="edit-subscription-form"
        submitting={submitting}
        submitLabel="حفظ التغييرات"
      >
        {editTarget && (
          <EditSubscriptionForm
            formId="edit-subscription-form"
            initial={editTarget}
            onSubmit={handleEditSubmit}
            submitting={submitting}
          />
        )}
      </ModalFormShell>
    </AppLayout>
  )
}
