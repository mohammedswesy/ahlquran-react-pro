/**
 * AddEmployeeModal — Premium Multi-Step Glassmorphism Modal
 * Indigo / Slate theme matching the Staff Dashboard aesthetic.
 */
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  X,
  User,
  Briefcase,
  Lock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  BookOpen,
  Users,
  Mail,
  Phone,
  Calendar,
  Eye,
  EyeOff,
  Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { listInstitutesOptions } from "@/services/institutes"
import { createEmployee } from "@/services/employees"
import { toast } from "sonner"

// ─── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  // Step 1
  name: z.string().min(2, "الاسم مطلوب (حدّه الأدنى حرفان)"),
  email: z.string().email("بريد إلكتروني غير صالح").nullable().optional().or(z.literal("")),
  phone: z.string().nullable().optional(),

  // Step 2
  job_title: z
    .string()
    .min(2, "المسمى الوظيفي مطلوب")
    .refine((v) => !v.includes("@"), "المسمى الوظيفي لا يجب أن يكون بريداً"),
  role: z.enum(["admin", "teacher", "staff"]).default("staff"),
  hire_date: z.string().nullable().optional(),
  institute_id: z.coerce.number().int().min(1, "اختر المعهد").optional(),

  // Step 3
  password: z
    .string()
    .min(8, "كلمة المرور 8 أحرف على الأقل")
    .optional()
    .or(z.literal("")),
  status: z.coerce.number().int().default(1),
})

export type AddEmployeeValues = z.infer<typeof schema>

// ─── Role Cards Config ──────────────────────────────────────────────────────────

const ROLE_CARDS = [
  {
    value: "admin" as const,
    label: "مشرف",
    desc: "صلاحيات إدارية كاملة",
    icon: ShieldCheck,
    gradient: "from-indigo-500 to-purple-600",
    border: "border-indigo-300",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    glow: "shadow-indigo-200",
  },
  {
    value: "teacher" as const,
    label: "معلّم",
    desc: "إدارة الحلقات التعليمية",
    icon: BookOpen,
    gradient: "from-emerald-500 to-teal-600",
    border: "border-emerald-300",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    glow: "shadow-emerald-200",
  },
  {
    value: "staff" as const,
    label: "موظّف",
    desc: "عضو الفريق الإداري",
    icon: Users,
    gradient: "from-slate-500 to-slate-700",
    border: "border-slate-300",
    bg: "bg-slate-50",
    text: "text-slate-700",
    glow: "shadow-slate-200",
  },
]

// ─── Step Indicators ────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "المعلومات الأساسية", icon: User },
  { id: 2, label: "بيانات الوظيفة", icon: Briefcase },
  { id: 3, label: "بيانات الدخول", icon: Lock },
]

// ─── Floating Input ─────────────────────────────────────────────────────────────

function FloatingInput({
  label,
  error,
  icon: Icon,
  type = "text",
  touched,
  valid,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  icon?: React.ElementType
  touched?: boolean
  valid?: boolean
}) {
  return (
    <div className="relative group">
      <div className="relative">
        {Icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          placeholder=" "
          className={cn(
            "peer w-full rounded-2xl border bg-white/90 px-4 pb-2 pt-6 text-sm text-slate-900 outline-none transition-all",
            Icon && "pr-10",
            "focus:ring-2 focus:ring-indigo-400 focus:border-transparent",
            error
              ? "border-rose-400 ring-1 ring-rose-200"
              : touched && valid
              ? "border-emerald-400 ring-1 ring-emerald-100"
              : "border-slate-200",
          )}
          {...props}
        />
        <label
          className={cn(
            "pointer-events-none absolute right-4 top-2 text-[10px] font-semibold tracking-wide transition-all",
            Icon && "right-10",
            error ? "text-rose-500" : touched && valid ? "text-emerald-600" : "text-slate-500",
          )}
        >
          {label}
        </label>
        {touched && valid && !error && (
          <CheckCircle2
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500"
          />
        )}
        {error && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-rose-500 font-semibold">
            !
          </span>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-rose-500 font-medium pr-1">{error}</p>
      )}
    </div>
  )
}

// ─── Success Celebration ────────────────────────────────────────────────────────

function SuccessScreen({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-8 text-center space-y-6">
      {/* Animated checkmark */}
      <div className="relative">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-200 animate-[bounce_0.6s_ease-out]">
          <CheckCircle2 size={60} className="text-white" strokeWidth={1.5} />
        </div>
        {/* Sparkle rings */}
        <div className="absolute inset-0 rounded-full border-4 border-emerald-300 animate-ping opacity-30" />
        <div className="absolute -inset-3 rounded-full border-2 border-teal-200 animate-ping opacity-20" style={{ animationDelay: "0.2s" }} />
      </div>

      <div className="space-y-2">
        <h3 className="text-2xl font-black text-slate-900">تمت الإضافة بنجاح! 🎉</h3>
        <p className="text-slate-600 text-sm">
          تم إنشاء حساب الموظف{" "}
          <span className="font-bold text-indigo-700">"{name}"</span>{" "}
          بنجاح وأصبح جاهزاً للاستخدام.
        </p>
      </div>

      {/* Decorative dots */}
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>

      <button
        onClick={onClose}
        className="mt-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:scale-105 transition-all duration-200"
      >
        إغلاق
      </button>
    </div>
  )
}

// ─── Main Modal ─────────────────────────────────────────────────────────────────

interface AddEmployeeModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AddEmployeeModal({ open, onClose, onSuccess }: AddEmployeeModalProps) {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [createdName, setCreatedName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [instOptions, setInstOptions] = useState<Array<{ id: number; name: string }>>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    reset,
    formState: { errors, touchedFields, dirtyFields },
  } = useForm<AddEmployeeValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      job_title: "",
      role: "staff",
      hire_date: "",
      institute_id: undefined,
      password: "",
      status: 1,
    },
  })

  const watchedRole = watch("role")
  const watchedInstId = watch("institute_id")
  const watchedName = watch("name")
  const watchedEmail = watch("email")
  const watchedPhone = watch("phone")
  const watchedJobTitle = watch("job_title")
  const watchedPassword = watch("password")

  useEffect(() => {
    ;(async () => {
      try {
        setInstOptions(await listInstitutesOptions())
      } catch {
        // ignore
      }
    })()
  }, [])

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        reset()
        setStep(1)
        setSuccess(false)
        setCreatedName("")
      }, 300)
    }
  }, [open, reset])

  const instName = useMemo(
    () => instOptions.find((i) => i.id === watchedInstId)?.name || "اختر المعهد…",
    [instOptions, watchedInstId],
  )

  // Step validation fields
  const step1Fields: (keyof AddEmployeeValues)[] = ["name", "email", "phone"]
  const step2Fields: (keyof AddEmployeeValues)[] = ["job_title", "role", "hire_date", "institute_id"]

  const goNext = async () => {
    const fieldsToValidate = step === 1 ? step1Fields : step2Fields
    const valid = await trigger(fieldsToValidate)
    if (valid) setStep((s) => Math.min(s + 1, 3))
  }

  const goPrev = () => setStep((s) => Math.max(s - 1, 1))

  const onSubmit = async (data: AddEmployeeValues) => {
    setSubmitting(true)
    try {
      const payload: any = { ...data }
      if (!payload.password) delete payload.password
      if (!payload.email) payload.email = null
      if (!payload.phone) payload.phone = null
      if (!payload.hire_date) payload.hire_date = null

      await createEmployee(payload)
      setCreatedName(data.name)
      setSuccess(true)
      onSuccess?.()
    } catch (e: any) {
      const msg = e?.response?.data?.message || "فشل إنشاء الموظف"
      toast.error(msg)
      // Errors on email: jump back to step 1
      if (e?.response?.data?.errors?.email) setStep(1)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-[28px] bg-white/95 shadow-2xl"
        style={{ boxShadow: "0 32px 80px rgba(79, 70, 229, 0.18), 0 8px 32px rgba(0,0,0,0.12)" }}
        dir="rtl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 z-10 rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Header gradient bar */}
        <div
          className="relative h-2 w-full"
          style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed, #06b6d4)" }}
        />

        {/* Title section */}
        {!success && (
          <div className="px-7 pt-6 pb-0">
            <h2 className="text-xl font-black text-slate-900">إضافة موظف جديد</h2>
            <p className="text-xs text-slate-500 mt-1">أكمل الخطوات لإضافة عضو جديد للفريق</p>

            {/* Step indicators */}
            <div className="mt-5 flex items-center gap-0">
              {STEPS.map((s, idx) => {
                const isCompleted = step > s.id
                const isActive = step === s.id
                const Icon = s.icon
                return (
                  <div key={s.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                          isCompleted
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                            : isActive
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                            : "bg-slate-100 text-slate-400",
                        )}
                      >
                        {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-semibold whitespace-nowrap",
                          isActive ? "text-indigo-700" : isCompleted ? "text-emerald-600" : "text-slate-400",
                        )}
                      >
                        {s.label}
                      </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all duration-500",
                          step > s.id ? "bg-emerald-400" : "bg-slate-200",
                        )}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-7 py-6 space-y-4 min-h-[300px]">
            {success ? (
              <SuccessScreen name={createdName} onClose={onClose} />
            ) : (
              <>
                {/* ── Step 1: Basic Info ───────────────────────── */}
                {step === 1 && (
                  <div className="space-y-4 animate-[fadeIn_0.25s_ease-out]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <User size={16} className="text-indigo-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">المعلومات الأساسية</span>
                    </div>

                    <FloatingInput
                      label="الاسم الكامل *"
                      icon={User}
                      error={errors.name?.message}
                      touched={!!touchedFields.name}
                      valid={!!watchedName && watchedName.length >= 2 && !errors.name}
                      {...register("name")}
                    />

                    <FloatingInput
                      label="البريد الإلكتروني"
                      type="email"
                      icon={Mail}
                      error={errors.email?.message}
                      touched={!!touchedFields.email}
                      valid={!!watchedEmail && !errors.email}
                      {...register("email")}
                    />

                    <FloatingInput
                      label="رقم الهاتف"
                      type="tel"
                      icon={Phone}
                      error={errors.phone?.message}
                      touched={!!touchedFields.phone}
                      valid={!!watchedPhone && !errors.phone}
                      {...register("phone")}
                    />
                  </div>
                )}

                {/* ── Step 2: Job Details ──────────────────────── */}
                {step === 2 && (
                  <div className="space-y-4 animate-[fadeIn_0.25s_ease-out]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Briefcase size={16} className="text-amber-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">بيانات الوظيفة</span>
                    </div>

                    {/* Role Cards */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">الدور الوظيفي *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {ROLE_CARDS.map((rc) => {
                          const Icon = rc.icon
                          const isSelected = watchedRole === rc.value
                          return (
                            <button
                              key={rc.value}
                              type="button"
                              onClick={() => setValue("role", rc.value, { shouldDirty: true })}
                              className={cn(
                                "relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all duration-200 cursor-pointer",
                                isSelected
                                  ? `${rc.border} ${rc.bg} shadow-lg ${rc.glow} scale-[1.03]`
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                              )}
                            >
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all",
                                  isSelected
                                    ? `bg-gradient-to-br ${rc.gradient} text-white`
                                    : "bg-slate-100 text-slate-400",
                                )}
                              >
                                <Icon size={20} />
                              </div>
                              <span
                                className={cn(
                                  "text-xs font-bold",
                                  isSelected ? rc.text : "text-slate-500",
                                )}
                              >
                                {rc.label}
                              </span>
                              <span className={cn("text-[9px]", isSelected ? rc.text : "text-slate-400")}>
                                {rc.desc}
                              </span>
                              {isSelected && (
                                <div className="absolute top-1 left-1">
                                  <CheckCircle2 size={14} className={rc.text} />
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <FloatingInput
                      label="المسمى الوظيفي *"
                      icon={Briefcase}
                      placeholder="مثال: مشرف / إداري / معلّم"
                      error={errors.job_title?.message}
                      touched={!!touchedFields.job_title}
                      valid={!!watchedJobTitle && watchedJobTitle.length >= 2 && !errors.job_title}
                      {...register("job_title")}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <FloatingInput
                        label="تاريخ التعيين"
                        type="date"
                        icon={Calendar}
                        {...register("hire_date")}
                      />

                      {/* Institute Selector */}
                      <div className="relative">
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
                          <Building2 size={16} />
                        </div>
                        <select
                          className="peer w-full rounded-2xl border border-slate-200 bg-white/90 pr-10 pl-4 pb-2 pt-6 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all appearance-none"
                          value={watchedInstId ?? ""}
                          onChange={(e) => setValue("institute_id", Number(e.target.value) || undefined as any, { shouldDirty: true })}
                        >
                          <option value="">اختر المعهد…</option>
                          {instOptions.map((i) => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                          ))}
                        </select>
                        <label className="pointer-events-none absolute right-10 top-2 text-[10px] font-semibold text-slate-500 tracking-wide">
                          المعهد
                        </label>
                        {errors.institute_id && (
                          <p className="mt-1 text-xs text-rose-500 font-medium pr-1">{errors.institute_id.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Step 3: Access & Security ────────────────── */}
                {step === 3 && (
                  <div className="space-y-4 animate-[fadeIn_0.25s_ease-out]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Lock size={16} className="text-purple-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">بيانات الدخول والأمان</span>
                    </div>

                    {/* Password Field with Toggle */}
                    <div className="relative">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder=" "
                        className={cn(
                          "peer w-full rounded-2xl border bg-white/90 pr-10 pl-10 pb-2 pt-6 text-sm text-slate-900 outline-none transition-all",
                          "focus:ring-2 focus:ring-indigo-400 focus:border-transparent",
                          errors.password
                            ? "border-rose-400 ring-1 ring-rose-200"
                            : watchedPassword && watchedPassword.length >= 8
                            ? "border-emerald-400 ring-1 ring-emerald-100"
                            : "border-slate-200",
                        )}
                        {...register("password")}
                      />
                      <label className="pointer-events-none absolute right-10 top-2 text-[10px] font-semibold text-slate-500 tracking-wide">
                        كلمة المرور (8 أحرف على الأقل)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      {/* Strength bar */}
                      {watchedPassword && watchedPassword.length > 0 && (
                        <div className="mt-2 flex gap-1">
                          {[...Array(4)].map((_, i) => {
                            const strength = Math.min(4, Math.floor(watchedPassword.length / 3))
                            return (
                              <div
                                key={i}
                                className={cn(
                                  "flex-1 h-1 rounded-full transition-all duration-300",
                                  i < strength
                                    ? strength <= 1 ? "bg-rose-400"
                                      : strength <= 2 ? "bg-amber-400"
                                      : strength <= 3 ? "bg-blue-400"
                                      : "bg-emerald-400"
                                    : "bg-slate-200",
                                )}
                              />
                            )
                          })}
                        </div>
                      )}
                      {errors.password && (
                        <p className="mt-1 text-xs text-rose-500 font-medium pr-1">{errors.password.message}</p>
                      )}
                    </div>

                    {/* Status Toggle */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-800">حالة الحساب</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {watch("status") === 1 ? "الحساب نشط وجاهز للاستخدام" : "الحساب موقوف مؤقتاً"}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setValue("status", watch("status") === 1 ? 0 : 1)}
                          className={cn(
                            "relative w-12 h-6 rounded-full transition-all duration-300",
                            watch("status") === 1 ? "bg-emerald-500" : "bg-slate-300",
                          )}
                        >
                          <div
                            className={cn(
                              "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300",
                              watch("status") === 1 ? "left-6" : "left-0.5",
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Summary card */}
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-2">
                      <div className="text-xs font-bold text-indigo-700 mb-2">ملخص المعلومات</div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <span className="text-slate-500">الاسم:</span>
                        <span className="font-semibold text-slate-800">{watchedName || "—"}</span>
                        <span className="text-slate-500">البريد:</span>
                        <span className="font-semibold text-slate-800 truncate">{watchedEmail || "—"}</span>
                        <span className="text-slate-500">المسمى الوظيفي:</span>
                        <span className="font-semibold text-slate-800">{watch("job_title") || "—"}</span>
                        <span className="text-slate-500">الدور:</span>
                        <span className="font-semibold text-slate-800">
                          {ROLE_CARDS.find((r) => r.value === watchedRole)?.label || "—"}
                        </span>
                        <span className="text-slate-500">المعهد:</span>
                        <span className="font-semibold text-slate-800 truncate">{instName}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          {!success && (
            <div className="px-7 pb-7 flex items-center justify-between gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={goPrev}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight size={16} />
                  السابق
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-105 transition-all duration-200"
                >
                  التالي
                  <ChevronLeft size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      جاري الحفظ…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      إضافة الموظف
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
