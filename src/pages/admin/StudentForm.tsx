import { useEffect, useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useSearchParams } from "react-router-dom"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import FormError from "@/components/ui/form-error"
import {
  Popover, PopoverTrigger, PopoverContent,
} from "@/components/ui/popover"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem,
} from "@/components/ui/command"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

import type { Student } from "@/services/students"
import { listInstitutesOptions } from "@/services/institutes"
import { listCircles, listCirclesByInstitute, type Circle } from "@/services/circles"
import { useAuth } from "@/store/auth"

const schema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  gender: z.enum(["male", "female"]).optional(),
  birthdate: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email("بريد غير صالح").nullable().optional(),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل").optional().or(z.literal("")),
  institute_id: z.coerce.number().int().min(1, "اختر المعهد").optional(),
  circle_id: z.coerce.number().int().optional(),
  status: z.coerce.number().int().optional().default(1),
})
export type StudentFormValues = z.infer<typeof schema>

type Props = {
  defaultValues?: Partial<Student>
  onSubmit: (values: StudentFormValues) => Promise<void> | void
  submitting?: boolean
  formId?: string
  showActions?: boolean
}

export default function StudentForm({ defaultValues, onSubmit, submitting, formId, showActions = true }: Props) {
  const role = useAuth((s) => s.role)
  const authInstituteId = useAuth((s) => s.instituteId)
  const isInstituteAdmin = role === "institute-admin"
  const [searchParams] = useSearchParams()

  const {
    register, handleSubmit, reset, watch, setValue, setError, clearErrors, formState: { errors }
  } = useForm<StudentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      gender: "male",
      birthdate: null,
      phone: null,
      email: null,
      password: "",
      institute_id: undefined,
      circle_id: undefined,
      status: 1,
      ...defaultValues,
    } as any
  })

  const instituteId = watch("institute_id")

  // Lists
  const [institutes, setInstitutes] = useState<Array<{ id: number; name: string }>>([])
  const [circles, setCircles] = useState<Circle[]>([])

  // UI state
  const [openInstitute, setOpenInstitute] = useState(false)
  const [openCircle, setOpenCircle] = useState(false)

  useEffect(() => {
    if (isInstituteAdmin) return
    ;(async () => {
      const opts = await listInstitutesOptions()
      setInstitutes(opts)
    })()
  }, [isInstituteAdmin])

  useEffect(() => {
    if (defaultValues?.id) return

    const fromQuery = Number(searchParams.get("institute_id") || "")
    const queryInstituteId = Number.isFinite(fromQuery) && fromQuery > 0 ? fromQuery : null

    const fromAuth = Number(authInstituteId)
    const authResolvedInstituteId = Number.isFinite(fromAuth) && fromAuth > 0 ? fromAuth : null

    const fromStorage = Number(localStorage.getItem("institute_id") || "")
    const storageInstituteId = Number.isFinite(fromStorage) && fromStorage > 0 ? fromStorage : null

    const resolvedInstituteId = queryInstituteId ?? authResolvedInstituteId ?? storageInstituteId
    if (resolvedInstituteId) {
      setValue("institute_id", resolvedInstituteId)
    }
  }, [defaultValues?.id, searchParams, authInstituteId, setValue])

  useEffect(() => {
    if (isInstituteAdmin) {
      ;(async () => {
        const scoped = await listCircles({ per_page: 1000 })
        setCircles(scoped?.data ?? [])
      })()
      return
    }

    if (!instituteId) { setCircles([]); setValue("circle_id", undefined); return }
    ;(async () => {
      const list = await listCirclesByInstitute(instituteId)
      setCircles(list)
      const current = watch("circle_id")
      if (!list.some(c => c.id === current)) setValue("circle_id", undefined)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instituteId, isInstituteAdmin])

  useEffect(() => {
    if (defaultValues) {
      reset({
        ...defaultValues,
        email: (defaultValues as any).email ?? null,
        password: "",
        institute_id: defaultValues.institute_id ? Number(defaultValues.institute_id) : undefined,
        circle_id: defaultValues.circle_id ? Number(defaultValues.circle_id) : undefined,
        status: defaultValues.status ?? 1,
      } as any)
    }
  }, [defaultValues, reset])

  const instituteName = useMemo(
    () => institutes.find(i => i.id === instituteId)?.name || "اختر المعهد…",
    [institutes, instituteId]
  )
  const circleName = useMemo(
    () => circles.find(c => c.id === watch("circle_id"))?.name || "اختر الحلقة…",
    [circles, watch]
  )

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(async (v) => {
        const isCreateMode = !(defaultValues as any)?.id

        if (isCreateMode && !v.email) {
          setError("email", { type: "manual", message: "البريد مطلوب" })
          return
        }

        if (isCreateMode && !v.password) {
          setError("password", { type: "manual", message: "كلمة المرور مطلوبة" })
          return
        }

        clearErrors(["email", "password"])

        const fromQuery = Number(searchParams.get("institute_id") || "")
        const queryInstituteId = Number.isFinite(fromQuery) && fromQuery > 0 ? fromQuery : null

        const fromAuth = Number(authInstituteId)
        const authResolvedInstituteId = Number.isFinite(fromAuth) && fromAuth > 0 ? fromAuth : null

        const fromStorage = Number(localStorage.getItem("institute_id") || "")
        const storageInstituteId = Number.isFinite(fromStorage) && fromStorage > 0 ? fromStorage : null

        const fallbackInstituteId = queryInstituteId ?? authResolvedInstituteId ?? storageInstituteId

        await onSubmit({
          ...v,
          institute_id: v.institute_id ?? fallbackInstituteId ?? undefined,
        })
      })}
      className="grid sm:grid-cols-2 gap-3"
      dir="rtl"
    >
      <div className="sm:col-span-2">
        <Input label="اسم الطالب" error={errors.name?.message} {...register("name")} />
        <FormError message={errors.name?.message} />
      </div>

      <div>
        <label className="block text-sm text-gray-700 mb-1">النوع</label>
        <select
          className="w-full rounded-md border px-3 py-2 text-right"
          defaultValue={defaultValues?.gender || "male"}
          onChange={(e) => setValue("gender", e.target.value as any)}
        >
          <option value="male">ذكر</option>
          <option value="female">أنثى</option>
        </select>
      </div>

      <div>
        <Input label="تاريخ الميلاد" type="date" {...register("birthdate")} />
      </div>

      <div>
        <Input label="الهاتف" {...register("phone")} />
      </div>

      <div className="sm:col-span-2 mt-1 rounded-lg border border-[var(--border)] p-3">
        <div className="text-sm font-semibold text-[var(--text)] mb-2">بيانات الحساب (للدخول للمنصة)</div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Input label="البريد الإلكتروني" type="email" error={errors.email?.message} {...register("email")} />
            <FormError message={errors.email?.message} />
          </div>

          <div>
            <Input label="كلمة المرور" type="password" error={errors.password?.message} {...register("password")} />
            <FormError message={errors.password?.message} />
          </div>
        </div>
      </div>

      {!isInstituteAdmin && (
        <div>
          <label className="block text-sm text-gray-700 mb-1">المعهد</label>
          <Popover open={openInstitute} onOpenChange={setOpenInstitute}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between">
                {instituteName}
                <ChevronsUpDown className="opacity-50 size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-0" align="end">
              <Command>
                <CommandInput placeholder="ابحث عن معهد…" className="text-right" />
                <CommandEmpty>لا توجد نتائج.</CommandEmpty>
                <CommandGroup>
                  {institutes.map((i) => (
                    <CommandItem
                      key={i.id}
                      value={i.name}
                      onSelect={() => {
                        setValue("institute_id", i.id, { shouldDirty: true, shouldValidate: true })
                        setOpenInstitute(false)
                      }}
                    >
                      <Check className={cn("ml-2 size-4", i.id === instituteId ? "opacity-100" : "opacity-0")} />
                      {i.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <FormError message={errors.institute_id?.message} />
        </div>
      )}

      {/* الحلقة */}
      <div>
        <label className="block text-sm text-gray-700 mb-1">الحلقة</label>
        <Popover open={openCircle} onOpenChange={setOpenCircle}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-between" disabled={!isInstituteAdmin && !instituteId}>
              {circleName}
              <ChevronsUpDown className="opacity-50 size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[260px] p-0" align="end">
            <Command>
              <CommandInput placeholder="ابحث عن حلقة…" className="text-right" />
              <CommandEmpty>لا توجد نتائج.</CommandEmpty>
              <CommandGroup>
                {circles.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.name}
                    onSelect={() => {
                      setValue("circle_id", c.id, { shouldDirty: true })
                      setOpenCircle(false)
                    }}
                  >
                    <Check className={cn("ml-2 size-4", c.id === watch("circle_id") ? "opacity-100" : "opacity-0")} />
                    {c.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Input label="الحالة (1=نشط, 0=موقوف)" type="number" {...register("status", { valueAsNumber: true })} />
      </div>

      {showActions && (
        <div className="sm:col-span-2 mt-2 flex gap-2">
          <Button disabled={!!submitting} type="submit">حفظ</Button>
          <Button type="button" variant="outline" onClick={() => reset()}>إعادة ضبط</Button>
        </div>
      )}
    </form>
  )
}
