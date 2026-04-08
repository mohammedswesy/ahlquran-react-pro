import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import FormError from "@/components/ui/form-error"

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

import type { Employee } from "@/services/employees"
import { listInstitutesOptions } from "@/services/institutes"

// ✅ schema: job_title مطلوب + يمنع الإيميل
// ✅ password: اختياري (يسمح فاضي) -> للتعديل
const schema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("بريد غير صالح").nullable().optional(),
  phone: z.string().nullable().optional(),

  job_title: z
    .string()
    .min(2, "المسمى الوظيفي مطلوب")
    .refine((v) => !v.includes("@"), "المسمى الوظيفي لا يجب أن يكون بريد إلكتروني"),

  role: z.enum(["admin", "teacher", "staff"]).optional(),

  hire_date: z.string().nullable().optional(),
  institute_id: z.coerce.number().int().min(1, "اختر المعهد").optional(),
  status: z.coerce.number().int().optional().default(1),

  // ✅ password اختياري + يسمح فاضي
  password: z
    .string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .optional()
    .or(z.literal("")),
})

export type EmployeeFormValues = z.infer<typeof schema>

type Props = {
  defaultValues?: Partial<Employee>
  onSubmit: (values: EmployeeFormValues) => Promise<void> | void
  submitting?: boolean
  formId?: string
  showActions?: boolean
  serverErrors?: Partial<Record<keyof EmployeeFormValues, string>>
}

export default function EmployeeForm({ defaultValues, onSubmit, submitting, formId, showActions = true, serverErrors = {} }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: null,
      phone: null,
      job_title: "",
      role: "staff",
      hire_date: null,
      institute_id: undefined,
      status: 1,
      password: "",
      ...defaultValues,
    } as any,
  })

  const instituteId = watch("institute_id")

  const [instOptions, setInstOptions] = useState<Array<{ id: number; name: string }>>([])
  const [openInst, setOpenInst] = useState(false)

  useEffect(() => {
    ; (async () => setInstOptions(await listInstitutesOptions()))()
  }, [])

  useEffect(() => {
    if (defaultValues) reset(defaultValues as any)
  }, [defaultValues, reset])

  const instName = useMemo(
    () => instOptions.find((i) => i.id === instituteId)?.name || "اختر المعهد…",
    [instOptions, instituteId]
  )

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(async (v) => {
        // ✅ لو password فاضية، نحذفها من payload (مفيد جدًا في edit)
        const payload: any = { ...v }
        if (!payload.password) delete payload.password

        await onSubmit(payload)
      })}
      className="grid sm:grid-cols-2 gap-3"
      dir="rtl"
    >
      {/* الاسم */}
      <div className="sm:col-span-2">
        <Input label="اسم الموظف" error={errors.name?.message} {...register("name")} />
        <FormError message={errors.name?.message} />
      </div>

      {/* المسمى الوظيفي */}
      <div className="sm:col-span-2">
        <Input
          label="المسمى الوظيفي"
          placeholder="مثال: مشرف / إداري / معلّم"
          error={errors.job_title?.message}
          {...register("job_title")}
        />
        <FormError message={errors.job_title?.message} />
      </div>

      {/* البريد + الهاتف */}
      <div>
        <Input label="البريد" type="email" error={errors.email?.message || serverErrors.email} {...register("email")} />
        <FormError message={errors.email?.message || serverErrors.email} />
      </div>

      <div>
        <Input label="الهاتف" error={errors.phone?.message} {...register("phone")} />
      </div>

      {/* كلمة المرور */}
      <div className="sm:col-span-2">
        <Input
          label="كلمة المرور للمستخدم (8 أحرف حد أدنى, اتركها فارغة عند التعديل)"
          type="password"
          error={errors.password?.message || serverErrors.password}
          {...register("password")}
        />
        <FormError message={errors.password?.message || serverErrors.password} />
      </div>

      {/* الدور */}
      <div>
        <label className="block text-sm text-gray-700 mb-1">الدور (Role)</label>
        <select
          className="w-full rounded-md border px-3 py-2 text-right"
          defaultValue={(defaultValues as any)?.role || "staff"}
          onChange={(e) => setValue("role", e.target.value as any)}
        >
          <option value="admin">مشرف</option>
          <option value="teacher">معلّم</option>
          <option value="staff">موظّف</option>
        </select>
      </div>

      {/* تاريخ التعيين */}
      <div>
        <Input label="تاريخ التعيين" type="date" {...register("hire_date")} />
      </div>

      {/* المعهد */}
      <div className="sm:col-span-2 md:col-span-1">
        <label className="block text-sm text-gray-700 mb-1">المعهد</label>
        <Popover open={openInst} onOpenChange={setOpenInst}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-between">
              {instName}
              <ChevronsUpDown className="opacity-50 size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[260px] p-0" align="end">
            <Command>
              <CommandInput placeholder="ابحث عن معهد…" className="text-right" />
              <CommandEmpty>لا توجد نتائج.</CommandEmpty>
              <CommandGroup>
                {instOptions.map((i) => (
                  <CommandItem
                    key={i.id}
                    value={i.name}
                    onSelect={() => {
                      setValue("institute_id", i.id)
                      setOpenInst(false)
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

      {/* الحالة */}
      <div>
        <Input
          label="الحالة (1=نشط, 0=موقوف)"
          type="number"
          {...register("status", { valueAsNumber: true })}
        />
      </div>

      {/* أزرار */}
      {showActions && (
        <div className="sm:col-span-2 mt-2 flex gap-2">
          <Button disabled={!!submitting} type="submit">
            حفظ
          </Button>
          <Button type="button" variant="outline" onClick={() => reset()}>
            إعادة ضبط
          </Button>
        </div>
      )}
    </form>
  )
}
