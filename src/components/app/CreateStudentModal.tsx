import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Mail,
  Home,
  Phone,
  User,
  Users,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { listCircles, listCirclesByInstitute, type Circle } from "@/services/circles"
import { listLevels, type Level } from "@/services/levels"

export const createStudentSchema = z.object({
  name: z.string().trim().min(2, "الاسم مطلوب (حرفان على الأقل)"),
  age: z.preprocess(
    (val) => {
      // RHF valueAsNumber returns NaN for empty or invalid number input.
      if (val === "" || val == null) return undefined
      if (typeof val === "number" && Number.isNaN(val)) return undefined
      return val
    },
    z
      .coerce
      .number({ invalid_type_error: "العمر مطلوب" })
      .min(1, "العمر مطلوب")
      .max(100, "العمر غير صالح")
      .refine((val) => Number.isFinite(val), { message: "يجب أن يكون رقماً صحيحاً" })
  ),
  gender: z.enum(["male", "female"], { required_error: "اختر النوع" }),
  email: z.string().trim().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
  mobile: z.string().trim().min(8, "رقم الجوال مطلوب"),
  address: z.string().min(4, "العنوان مطلوب"),
  emergency_contact: z.string().min(8, "جهة التواصل للطوارئ مطلوبة"),
  circle_id: z.coerce.number().int().min(1, "اختر الحلقة"),
  level_id: z.coerce.number().int().min(1, "اختر المستوى"),
})

export type CreateStudentModalValues = z.input<typeof createStudentSchema>
type CreateStudentModalSubmitValues = z.output<typeof createStudentSchema>

export type CreateStudentSubmitPayload = {
  name: string
  age: number
  gender: "male" | "female"
  email: string
  password: string
  mobile: string
  address: string
  emergency_contact: string
  circle_id: number
  level_id: number
  level: string
  institute_id?: number
  avatar?: File | null
}

type LevelOption = {
  id: number
  label: string
}

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateStudentSubmitPayload) => Promise<void> | void
  instituteId?: number
  title?: string
}

const STEPS = [
  { id: 1, label: "البيانات الشخصية", icon: User },
  { id: 2, label: "بيانات التواصل", icon: Phone },
  { id: 3, label: "التسكين الأكاديمي", icon: Users },
]

type StepInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  touched?: boolean
  valid?: boolean
  icon?: React.ElementType
  onValueChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void
}

const StepInput = React.forwardRef<
  HTMLInputElement,
  StepInputProps
>(function StepInput({
  label,
  error,
  touched,
  valid,
  icon: Icon,
  className,
  onChange,
  onValueChange,
  ...props
}, ref) {
  const showError = !!error && touched

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event)
    onValueChange?.(event.target.value, event)
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        {Icon && (
          <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon size={16} />
          </div>
        )}

        <input
          ref={ref}
          placeholder=" "
          onChange={handleChange}
          className={cn(
            "peer w-full rounded-2xl border bg-white/85 px-4 pb-2 pt-6 text-sm text-slate-900 shadow-sm backdrop-blur-sm outline-none transition-all",
            Icon && "pr-10",
            "focus:border-transparent focus:ring-2 focus:ring-indigo-400",
            showError
              ? "border-rose-400 ring-2 ring-rose-200/90 shadow-[0_0_0_4px_rgba(244,63,94,0.12)]"
              : touched && valid
                ? "border-emerald-400 ring-1 ring-emerald-100"
                : "border-slate-200",
          )}
          {...props}
        />

        <label
          className={cn(
            "pointer-events-none absolute top-2 text-[10px] font-semibold tracking-wide",
            Icon ? "right-10" : "right-4",
            showError ? "text-rose-500" : touched && valid ? "text-emerald-600" : "text-slate-500",
          )}
        >
          {label}
        </label>

        {touched && valid && !showError && (
          <CheckCircle2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
        )}
      </div>

      {showError && <p className="mt-1 pr-1 text-xs font-medium text-rose-500">{error}</p>}
    </div>
  )
})
StepInput.displayName = "StepInput"

function SuccessCelebration({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="relative mb-5">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-2xl shadow-emerald-200 animate-[bounce_0.7s_ease-out]">
          <CheckCircle2 size={54} strokeWidth={1.7} />
        </div>
        <div className="absolute inset-0 rounded-full border-4 border-emerald-300/60 animate-ping" />
      </div>

      <h3 className="text-2xl font-black text-slate-900">تم إنشاء الطالب بنجاح</h3>
      <p className="mt-2 text-sm text-slate-600">
        الطالب <span className="font-bold text-emerald-700">{name || "الجديد"}</span> أصبح جاهزًا ضمن النظام.
      </p>

      <div className="mt-5 flex gap-2">
        {[0, 1, 2, 3, 4].map((idx) => (
          <span
            key={idx}
            className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"
            style={{ animationDelay: `${idx * 120}ms` }}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-7 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-7 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] hover:shadow-indigo-300"
      >
        إغلاق
      </button>
    </div>
  )
}

export default function CreateStudentModal({
  open,
  onClose,
  onSubmit,
  instituteId,
  title = "إضافة طالب جديد",
}: Props) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [step, setStep] = React.useState(1)
  const [submitting, setSubmitting] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [createdName, setCreatedName] = React.useState("")
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)
  const [circles, setCircles] = React.useState<Circle[]>([])
  const [levels, setLevels] = React.useState<LevelOption[]>([])
  const [levelsLoading, setLevelsLoading] = React.useState(false)

  const {
    register,
    watch,
    reset,
    setValue,
    setError,
    trigger,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm<CreateStudentModalValues, any, CreateStudentModalSubmitValues>({
    resolver: zodResolver(createStudentSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      age: undefined as unknown as number,
      gender: "male",
      email: "",
      password: "",
      mobile: "",
      address: "",
      emergency_contact: "",
      circle_id: undefined as unknown as number,
      level_id: undefined as unknown as number,
    },
  })

  const watchedName = watch("name")
  const watchedAge = watch("age")
  const nameField = register("name")
  const ageField = register("age", { valueAsNumber: true })

  const watchedGender = watch("gender")
  const watchedMobile = watch("mobile")
  const watchedEmail = watch("email")
  const watchedPassword = watch("password")
  const watchedAddress = watch("address")
  const watchedEmergency = watch("emergency_contact")
  const watchedCircleId = watch("circle_id")
  const watchedLevelId = watch("level_id")

  const levelLabel = React.useMemo(
    () => levels.find((option) => option.id === Number(watchedLevelId))?.label || "اختر المستوى…",
    [levels, watchedLevelId],
  )

  const circleName = React.useMemo(
    () => circles.find((c) => c.id === Number(watchedCircleId))?.name || "اختر الحلقة…",
    [circles, watchedCircleId],
  )

  React.useEffect(() => {
    if (!open) return

    ;(async () => {
      try {
        if (instituteId) {
          const scoped = await listCirclesByInstitute(instituteId)
          setCircles(scoped)
          return
        }

        const res = await listCircles({ per_page: 1000 })
        setCircles(res.data ?? [])
      } catch {
        setCircles([])
      }
    })()
  }, [open, instituteId])

  React.useEffect(() => {
    if (!open) return

    ;(async () => {
      setLevelsLoading(true)
      try {
        const response = await listLevels()
        const options = response.map((level: Level) => ({
          id: Number(level.id),
          label: String(level.name_ar ?? level.name ?? "").trim(),
        })).filter((level) => Number.isFinite(level.id) && level.id > 0 && level.label.length > 0)
        setLevels(options)
      } catch {
        setLevels([])
      } finally {
        setLevelsLoading(false)
      }
    })()
  }, [open])

  React.useEffect(() => {
    if (open) return

    setTimeout(() => {
      reset()
      setStep(1)
      setSuccess(false)
      setCreatedName("")
      setAvatarFile(null)
      setAvatarPreview(null)
      setLevels([])
      setLevelsLoading(false)
      setSubmitting(false)
    }, 220)
  }, [open, reset])

  const step1Fields: (keyof CreateStudentModalValues)[] = ["name", "age", "gender"]
  const step2Fields: (keyof CreateStudentModalValues)[] = [
    "mobile",
    "email",
    "password",
    "address",
    "emergency_contact",
  ]
  const isUploadingImage = submitting && !!avatarFile

  const goNext = async () => {
    const fields = step === 1 ? step1Fields : step2Fields
    const valid = await trigger(fields)
    if (valid) {
      setStep((prev) => Math.min(prev + 1, 3))
    }
  }

  const goPrev = () => setStep((prev) => Math.max(prev - 1, 1))

  const handleAvatarPick = (file?: File | null) => {
    if (!file) {
      setAvatarFile(null)
      setAvatarPreview(null)
      return
    }

    setAvatarFile(file)
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  const submitHandler = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const selectedCircle = circles.find((circle) => circle.id === Number(values.circle_id))
      if (!selectedCircle) {
        setError("circle_id", { type: "manual", message: "اختر الحلقة" })
        return
      }

      const selectedLevel = levels.find((option) => option.id === Number(values.level_id))
      if (!selectedLevel) {
        setError("level_id", { type: "manual", message: "اختر المستوى" })
        return
      }

      const data: CreateStudentSubmitPayload = {
        name: values.name,
        age: Number(values.age),
        gender: values.gender,
        email: values.email,
        password: values.password,
        mobile: values.mobile,
        address: values.address,
        emergency_contact: values.emergency_contact,
        circle_id: Math.trunc(Number(values.circle_id)),
        level_id: Math.trunc(Number(values.level_id)),
        level: selectedLevel.label,
        institute_id: instituteId,
        avatar: avatarFile,
      }

      console.log("Submitting this:", data)
      console.log("Final Payload:", data)

      await onSubmit(data)
      setCreatedName(values.name)
      onClose()
    } catch (err: any) {
      console.log("Validation Errors:", err?.response?.data?.errors)
    } finally {
      setSubmitting(false)
    }
  })

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.58)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/50 bg-white/90 shadow-2xl"
        style={{ boxShadow: "0 30px 80px rgba(79,70,229,0.2), 0 12px 30px rgba(16,24,40,0.12)" }}
        dir="rtl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-4 z-10 rounded-full bg-slate-100 p-1.5 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600"
        >
          <X size={16} />
        </button>

        <div className="h-2 w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500" />

        {!success && (
          <div className="px-7 pt-6">
            <h2 className="text-xl font-black text-slate-900">{title}</h2>
            <p className="mt-1 text-xs text-slate-500">3 خطوات سريعة لإضافة طالب جديد بشكل احترافي</p>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>التقدم</span>
                <span>{Math.round((step / 3) * 100)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {STEPS.map((s, idx) => {
                const isDone = step > s.id
                const isActive = step === s.id
                const Icon = s.icon

                return (
                  <div key={s.id} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all",
                          isDone
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                            : isActive
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                              : "bg-slate-100 text-slate-400",
                        )}
                      >
                        {isDone ? <Check size={16} /> : <Icon size={15} />}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-semibold whitespace-nowrap",
                          isDone ? "text-emerald-600" : isActive ? "text-indigo-700" : "text-slate-400",
                        )}
                      >
                        {s.label}
                      </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "mx-2 mb-4 h-0.5 flex-1 rounded-full transition-colors",
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

        <form onSubmit={submitHandler}>
          <div className="min-h-[360px] space-y-4 px-7 py-6">
            {success ? (
              <SuccessCelebration name={createdName} onClose={onClose} />
            ) : (
              <>
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100">
                        <User size={16} className="text-indigo-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">البيانات الشخصية</span>
                    </div>

                    <StepInput
                      label="اسم الطالب *"
                      icon={User}
                      error={errors.name?.message}
                      touched={!!touchedFields.name}
                      valid={!!watchedName && !errors.name}
                      {...nameField}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <StepInput
                        label="العمر *"
                        type="number"
                        min={4}
                        max={100}
                        error={errors.age?.message}
                        touched={!!touchedFields.age}
                        valid={!!watchedAge && !errors.age}
                        {...ageField}
                      />

                      <div className="rounded-2xl border border-slate-200 bg-white/85 p-2 shadow-sm backdrop-blur-sm">
                        <label className="mb-2 block px-2 text-[11px] font-semibold text-slate-500">النوع *</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setValue("gender", "male", { shouldDirty: true, shouldValidate: true })}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-sm font-semibold transition-all",
                              watchedGender === "male"
                                ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                                : "border-slate-200 text-slate-600 hover:bg-slate-50",
                            )}
                          >
                            ذكر
                          </button>
                          <button
                            type="button"
                            onClick={() => setValue("gender", "female", { shouldDirty: true, shouldValidate: true })}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-sm font-semibold transition-all",
                              watchedGender === "female"
                                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 text-slate-600 hover:bg-slate-50",
                            )}
                          >
                            أنثى
                          </button>
                        </div>
                        {errors.gender && <p className="mt-2 px-2 text-xs font-medium text-rose-500">{errors.gender.message}</p>}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4">
                      <div className="mb-3 flex items-center gap-2 text-indigo-700">
                        <Camera size={16} />
                        <span className="text-xs font-bold">صورة الطالب (اختياري)</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-16 w-16 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="student avatar" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <User size={22} />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleAvatarPick(e.target.files?.[0] ?? null)}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-200 transition hover:bg-indigo-50"
                          >
                            رفع صورة
                          </button>
                          {avatarPreview && (
                            <button
                              type="button"
                              onClick={() => {
                                if (fileInputRef.current) fileInputRef.current.value = ""
                                handleAvatarPick(null)
                              }}
                              className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-rose-600 shadow-sm ring-1 ring-rose-200 transition hover:bg-rose-50"
                            >
                              إزالة
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
                        <Phone size={16} className="text-emerald-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">بيانات التواصل</span>
                    </div>

                    <StepInput
                      label="رقم الجوال *"
                      type="tel"
                      icon={Phone}
                      error={errors.mobile?.message}
                      touched={!!touchedFields.mobile}
                      valid={!!watchedMobile && !errors.mobile}
                      {...register("mobile")}
                    />

                    <StepInput
                      label="البريد الإلكتروني *"
                      type="email"
                      icon={Mail}
                      error={errors.email?.message}
                      touched={!!touchedFields.email}
                      valid={!!watchedEmail && !errors.email}
                      {...register("email")}
                    />

                    <StepInput
                      label="كلمة المرور *"
                      type="password"
                      icon={Lock}
                      error={errors.password?.message}
                      touched={!!touchedFields.password}
                      valid={!!watchedPassword && !errors.password}
                      {...register("password")}
                    />

                    <StepInput
                      label="العنوان *"
                      icon={Home}
                      error={errors.address?.message}
                      touched={!!touchedFields.address}
                      valid={!!watchedAddress && !errors.address}
                      {...register("address")}
                    />

                    <StepInput
                      label="جهة اتصال للطوارئ *"
                      type="tel"
                      icon={Users}
                      error={errors.emergency_contact?.message}
                      touched={!!touchedFields.emergency_contact}
                      valid={!!watchedEmergency && !errors.emergency_contact}
                      {...register("emergency_contact")}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100">
                        <Users size={16} className="text-indigo-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">التسكين الأكاديمي</span>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 pb-2 pt-6 shadow-sm backdrop-blur-sm">
                      <label className="pointer-events-none mb-2 block text-[10px] font-semibold tracking-wide text-slate-500">
                        الحلقة *
                      </label>
                      <select
                        className={cn(
                          "w-full appearance-none rounded-xl border bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-all",
                          errors.circle_id
                            ? "border-rose-400 ring-2 ring-rose-200"
                            : "border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300",
                        )}
                        value={watchedCircleId ?? ""}
                        onChange={(e) => {
                          const next = Number(e.target.value)
                          setValue("circle_id", Number.isFinite(next) && next > 0 ? next : undefined as unknown as number, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }}
                      >
                        <option value="">اختر الحلقة…</option>
                        {circles.map((circle) => (
                          <option key={circle.id} value={circle.id}>
                            {circle.name}
                          </option>
                        ))}
                      </select>
                      {errors.circle_id && <p className="mt-1 text-xs font-medium text-rose-500">{errors.circle_id.message}</p>}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 pb-2 pt-6 shadow-sm backdrop-blur-sm">
                      <label className="pointer-events-none mb-2 block text-[10px] font-semibold tracking-wide text-slate-500">
                        المستوى *
                      </label>
                      <select
                        className={cn(
                          "w-full appearance-none rounded-xl border bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-all",
                          errors.level_id
                            ? "border-rose-400 ring-2 ring-rose-200"
                            : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300",
                        )}
                        disabled={levelsLoading || levels.length === 0}
                        value={watchedLevelId ?? ""}
                        onChange={(e) => {
                          const next = Number(e.target.value)
                          setValue("level_id", Number.isFinite(next) && next > 0 ? next : undefined as unknown as number, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }}
                      >
                        <option value="">
                          {levelsLoading ? "جاري تحميل المستويات..." : levels.length === 0 ? "لا توجد مستويات متاحة" : "اختر المستوى…"}
                        </option>
                        {levels.map((level) => (
                          <option key={level.id} value={level.id}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                      {errors.level_id && <p className="mt-1 text-xs font-medium text-rose-500">{errors.level_id.message}</p>}
                    </div>

                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs">
                      <div className="mb-2 font-bold text-indigo-700">ملخص سريع</div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-slate-500">الاسم:</span>
                        <span className="font-semibold text-slate-800">{watchedName || "—"}</span>
                        <span className="text-slate-500">العمر:</span>
                        <span className="font-semibold text-slate-800">{watchedAge == null || watchedAge === "" ? "—" : String(watchedAge)}</span>
                        <span className="text-slate-500">الحلقة:</span>
                        <span className="truncate font-semibold text-slate-800">{circleName}</span>
                        <span className="text-slate-500">المستوى:</span>
                        <span className="font-semibold text-slate-800">{levelLabel || "—"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {!success && (
            <div className="flex items-center justify-between gap-3 px-7 pb-7">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={goPrev}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
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
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:scale-[1.02] hover:shadow-indigo-300"
                >
                  التالي
                  <ChevronLeft size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all duration-200 hover:scale-[1.02] hover:shadow-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {isUploadingImage ? "جاري رفع الصورة..." : "جاري الحفظ..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      حفظ الطالب
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
