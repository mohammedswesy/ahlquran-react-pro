import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import FormError from "@/components/ui/form-error"
import {
    Popover, PopoverTrigger, PopoverContent,
} from "@/components/ui/popover"
import {
    Command, CommandInput, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

import type { Teacher } from "@/services/teachers"
import { listInstitutesOptions } from "@/services/institutes"
import { listCirclesByInstitute, listCircles, type Circle } from "@/services/circles"
import { useAuth } from "@/store/auth"

const schema = z.object({
    name: z.string().min(2, "الاسم مطلوب"),
    gender: z.enum(["male", "female"]).optional(),
    email: z.string().email("بريد غير صالح").min(1, "البريد مطلوب"),
    password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل").optional().or(z.literal("")),
    phone: z.string().nullable().optional(),
    hire_date: z.string().nullable().optional(),
    institute_id: z.coerce.number().int().min(1, "اختر المعهد").optional(),
    circle_id: z.coerce.number().int().optional(),
    status: z.coerce.number().int().optional().default(1),
})
export type TeacherFormValues = z.infer<typeof schema>

type Props = {
    defaultValues?: Partial<Teacher>
    onSubmit: (values: TeacherFormValues) => Promise<void> | void
    submitting?: boolean
    formId?: string
    showActions?: boolean
    serverErrors?: Partial<Record<keyof TeacherFormValues, string>>
}

export default function TeacherForm({ defaultValues, onSubmit, submitting, formId, showActions = true, serverErrors = {} }: Props) {
    const role = useAuth((s) => s.role)
    const isInstituteAdmin = role === "institute-admin"

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
        useForm<TeacherFormValues>({
            resolver: zodResolver(schema),
            defaultValues: {
                name: "",
                gender: "male",
                email: null,
                phone: null,
                hire_date: null,
                institute_id: undefined,
                circle_id: undefined,
                status: 1,
                ...defaultValues,
            } as any
        })

    const instituteId = watch("institute_id")

    const [institutes, setInstitutes] = useState<Array<{ id: number; name: string }>>([])
    const [circles, setCircles] = useState<Circle[]>([])
    const [openInst, setOpenInst] = useState(false)
    const [openCircle, setOpenCircle] = useState(false)

    useEffect(() => {
        if (isInstituteAdmin) return
        ; (async () => setInstitutes(await listInstitutesOptions()))()
    }, [isInstituteAdmin])

    useEffect(() => {
        if (isInstituteAdmin) {
            ; (async () => {
                const scoped = await listCircles({ per_page: 1000 })
                setCircles(scoped?.data ?? [])
            })()
            return
        }

        if (!instituteId) { setCircles([]); setValue("circle_id", undefined); return }
        ; (async () => {
            const list = await listCirclesByInstitute(instituteId)
            setCircles(list)
            const current = watch("circle_id")
            if (!list.some(c => c.id === current)) setValue("circle_id", undefined)
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [instituteId, isInstituteAdmin])

    useEffect(() => { if (defaultValues) reset(defaultValues as any) }, [defaultValues, reset])

    const instName = useMemo(
        () => institutes.find(i => i.id === instituteId)?.name || "اختر المعهد…",
        [institutes, instituteId]
    )
    const circleName = useMemo(
        () => circles.find(c => c.id === watch("circle_id"))?.name || "اختر الحلقة…",
        [circles, watch]
    )

    return (
        <form id={formId} onSubmit={handleSubmit(async v => { await onSubmit(v) })} className="grid sm:grid-cols-2 gap-3" dir="rtl">
            <div className="sm:col-span-2">
                <Input label="اسم المعلّم" error={errors.name?.message} {...register("name")} />
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
                <Input label="البريد" type="email" error={errors.email?.message || serverErrors.email} {...register("email")} />
                <FormError message={errors.email?.message || serverErrors.email} />
            </div>
            <div>
                <Input label="كلمة المرور" type="password" error={errors.password?.message || serverErrors.password} {...register("password")} />
                <FormError message={errors.password?.message || serverErrors.password} />
            </div>
            <div><Input label="الهاتف" {...register("phone")} /></div>
            <div><Input label="تاريخ التعيين" type="date" {...register("hire_date")} /></div>

            {!isInstituteAdmin && (
                <div>
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
                                    {institutes.map((i) => (
                                        <CommandItem
                                            key={i.id}
                                            value={i.name}
                                            onSelect={() => { setValue("institute_id", i.id); setOpenInst(false) }}
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
                                        onSelect={() => { setValue("circle_id", c.id); setOpenCircle(false) }}
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

            <div><Input label="الحالة (1=نشط, 0=موقوف)" type="number" {...register("status", { valueAsNumber: true })} /></div>

            {showActions && (
                <div className="sm:col-span-2 mt-2 flex gap-2">
                    <Button disabled={!!submitting} type="submit">حفظ</Button>
                    <Button type="button" variant="outline" onClick={() => reset()}>إعادة ضبط</Button>
                </div>
            )}
        </form>
    )
}
