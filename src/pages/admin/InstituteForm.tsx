import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

import type { Institute } from "@/services/institutes"
import { fetchCountries } from "@/services/countries"
import { listCities } from "@/services/cities"
import { listOrganizations } from "@/services/organizations"
import type { BaseRow } from "@/types/base"

const schema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  country_id: z.coerce.number().int().min(1, "اختر الدولة"),
  city_id: z.coerce.number().int().min(1, "اختر المدينة"),
  organization_id: z.coerce.number().int().nullable().optional(),
  latitude: z.coerce.number().nullable().optional(),
  longitude: z.coerce.number().nullable().optional(),
  status: z.coerce.number().int().optional().default(1),

  // 🟢 بيانات مدير المعهد (تستخدم فقط في الإنشاء)
  admin_name: z.string().min(2, "اسم المدير قصير جدًا").or(z.literal("")).optional(),
  admin_email: z.string().email("البريد غير صالح").or(z.literal("")).optional(),
  admin_mobile: z.string().min(5, "رقم الجوال قصير").or(z.literal("")).optional(),
  admin_password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل").or(z.literal("")).optional(),
})

export type InstituteFormValues = z.infer<typeof schema>

type Props = {
  defaultValues?: Partial<Institute>
  onSubmit: (values: InstituteFormValues) => Promise<void> | void
  submitting?: boolean
  /** create: نعرض حقول مدير المعهد - edit: نخفيها */
  mode?: "create" | "edit"
}

export default function InstituteForm({
  defaultValues,
  onSubmit,
  submitting,
  mode = "edit",
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InstituteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      country_id: 0,
      city_id: 0,
      organization_id: null,
      latitude: null,
      longitude: null,
      status: 1,

      // 🟢 افتراضيات مدير المعهد
      admin_name: "",
      admin_email: "",
      admin_mobile: "",
      admin_password: "",
      ...defaultValues,
    } as any,
  })

  // Lists
  const [countries, setCountries] = useState<BaseRow[]>([])
  const [cities, setCities] = useState<BaseRow[]>([])
  const [orgs, setOrgs] = useState<BaseRow[]>([])

  // UI State
  const [openCountry, setOpenCountry] = useState(false)
  const [openCity, setOpenCity] = useState(false)
  const [openOrg, setOpenOrg] = useState(false)
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingOrgs, setLoadingOrgs] = useState(false)

  // Watched fields
  const countryId = watch("country_id")
  const cityId = watch("city_id")
  const orgId = watch("organization_id")

  // Load countries + organizations once
  useEffect(() => {
    (async () => {
      setLoadingCountries(true)
      setLoadingOrgs(true)
      try {
        const [c, o] = await Promise.all([fetchCountries(), listOrganizations()])
        setCountries(c)
        setOrgs(o)
      } finally {
        setLoadingCountries(false)
        setLoadingOrgs(false)
      }
    })()
  }, [])

  // Load cities on country change
  useEffect(() => {
    if (!countryId) {
      setCities([])
      setValue("city_id", 0, { shouldDirty: true })
      return
    }
    ; (async () => {
      setLoadingCities(true)
      try {
        const cityOpts = await listCities({ country_id: countryId })
        setCities(cityOpts)
        // ensure current city belongs to selected country
        if (!cityOpts.some((c) => Number(c.id) === Number(cityId))) {
          setValue("city_id", 0, { shouldDirty: true })
        }
      } finally {
        setLoadingCities(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryId])

  // Sync defaultValues (edit mode)
  useEffect(() => {
    if (defaultValues) {
      const dv = {
        ...defaultValues,
        country_id: defaultValues.country_id ? Number(defaultValues.country_id) : 0,
        city_id: defaultValues.city_id ? Number(defaultValues.city_id) : 0,
        organization_id:
          defaultValues.organization_id != null ? Number(defaultValues.organization_id) : null,
        latitude: defaultValues.latitude ?? null,
        longitude: defaultValues.longitude ?? null,
        status: defaultValues.status ?? 1,

        // في edit ما بنجيب بيانات مدير المعهد من الـ API، نخليها فاضية
        admin_name: "",
        admin_email: "",
        admin_mobile: "",
        admin_password: "",
      } as any
      reset(dv)
    }
  }, [defaultValues, reset])

  // Labels
  const countryName = useMemo(
    () =>
      countries.find((c) => Number(c.id) === Number(countryId))?.name ||
      (loadingCountries ? "جارِ التحميل…" : "اختر الدولة…"),
    [countries, countryId, loadingCountries]
  )
  const cityName = useMemo(
    () =>
      cities.find((c) => Number(c.id) === Number(cityId))?.name ||
      (loadingCities ? "جارِ التحميل…" : "اختر المدينة…"),
    [cities, cityId, loadingCities]
  )
  const orgName = useMemo(
    () =>
      orgId != null
        ? orgs.find((o) => Number(o.id) === Number(orgId))?.name || "—"
        : "بدون منظمة",
    [orgs, orgId]
  )

  return (
    <form
      onSubmit={handleSubmit(async (v) => { await onSubmit(v) })}
      className="grid sm:grid-cols-2 gap-3"
      dir="rtl"
    >
      {/* الاسم */}
      <div className="sm:col-span-2">
        <Input label="اسم المعهد" {...register("name")} />
        {errors.name && <div className="text-red-600 text-xs mt-1">{errors.name.message}</div>}
      </div>

      {/* الدولة */}
      <div>
        <label className="block text-sm text-gray-700 mb-1">الدولة</label>
        <Popover open={openCountry} onOpenChange={setOpenCountry}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-between">
              {countryName}
              <ChevronsUpDown className="opacity-50 size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="end">
            <Command>
              <CommandInput placeholder="ابحث عن دولة…" className="text-right" />
              <CommandEmpty>لا توجد نتائج.</CommandEmpty>
              <CommandGroup>
                {countries.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.name}
                    onSelect={() => {
                      setValue("country_id", Number(c.id), { shouldDirty: true, shouldValidate: true })
                      setOpenCountry(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "ml-2 size-4",
                        Number(c.id) === Number(countryId) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {c.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        {errors.country_id && (
          <div className="text-red-600 text-xs mt-1">{errors.country_id.message}</div>
        )}
      </div>

      {/* المدينة */}
      <div>
        <label className="block text-sm text-gray-700 mb-1">المدينة</label>
        <Popover open={openCity} onOpenChange={setOpenCity}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between"
              disabled={!countryId}
            >
              {cityName}
              <ChevronsUpDown className="opacity-50 size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="end">
            <Command>
              <CommandInput placeholder="ابحث عن مدينة…" className="text-right" />
              <CommandEmpty>لا توجد نتائج.</CommandEmpty>
              <CommandGroup>
                {cities.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.name}
                    onSelect={() => {
                      setValue("city_id", Number(c.id), { shouldDirty: true, shouldValidate: true })
                      setOpenCity(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "ml-2 size-4",
                        Number(c.id) === Number(cityId) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {c.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        {errors.city_id && (
          <div className="text-red-600 text-xs mt-1">{errors.city_id.message}</div>
        )}
      </div>

      {/* المنظمة (اختياري) */}
      <div className="sm:col-span-2">
        <label className="block text-sm text-gray-700 mb-1">المنظمة (اختياري)</label>
        <Popover open={openOrg} onOpenChange={setOpenOrg}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-between">
              {orgName}
              <ChevronsUpDown className="opacity-50 size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[420px] p-0" align="end">
            <Command>
              <CommandInput placeholder="ابحث عن منظمة… (يمكن تركها فارغة)" className="text-right" />
              <CommandEmpty>لا توجد نتائج.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="بدون منظمة"
                  onSelect={() => {
                    setValue("organization_id", null, { shouldDirty: true })
                    setOpenOrg(false)
                  }}
                >
                  <Check className={cn("ml-2 size-4", orgId == null ? "opacity-100" : "opacity-0")} />
                  بدون منظمة
                </CommandItem>

                {orgs.map((o) => (
                  <CommandItem
                    key={o.id}
                    value={o.name}
                    onSelect={() => {
                      setValue("organization_id", Number(o.id), { shouldDirty: true })
                      setOpenOrg(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "ml-2 size-4",
                        Number(o.id) === Number(orgId) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {o.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* الإحداثيات + الحالة */}
      <div>
        <Input label="Latitude (اختياري)" type="number" step="any" {...register("latitude")} />
      </div>
      <div>
        <Input label="Longitude (اختياري)" type="number" step="any" {...register("longitude")} />
      </div>
      <div>
        <Input
          label="الحالة (1=نشط, 0=موقوف)"
          type="number"
          {...register("status", { valueAsNumber: true })}
        />
      </div>

      {/* 🟢 سكشن مدير المعهد – فقط في الإنشاء */}
      {mode === "create" && (
        <div className="sm:col-span-2 mt-4 p-3 border rounded-lg space-y-3 bg-slate-50">
          <div className="font-semibold text-sm text-gray-800">بيانات مدير المعهد (اختياري)</div>
          <p className="text-xs text-gray-500">
            يمكنك ترك هذه الحقول فارغة وسيتم إنشاء المعهد فقط، بدون إنشاء حساب مدير.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Input label="اسم المدير" {...register("admin_name")} />
              {errors.admin_name && (
                <div className="text-red-600 text-xs mt-1">
                  {errors.admin_name.message as string}
                </div>
              )}
            </div>
            <div>
              <Input label="البريد الإلكتروني للمدير" type="email" {...register("admin_email")} />
              {errors.admin_email && (
                <div className="text-red-600 text-xs mt-1">
                  {errors.admin_email.message as string}
                </div>
              )}
            </div>
            <div>
              <Input label="جوال المدير" {...register("admin_mobile")} />
              {errors.admin_mobile && (
                <div className="text-red-600 text-xs mt-1">
                  {errors.admin_mobile.message as string}
                </div>
              )}
            </div>
            <div>
              <Input
                label="كلمة مرور المدير (اختياري)"
                type="password"
                {...register("admin_password")}
              />
              {errors.admin_password && (
                <div className="text-red-600 text-xs mt-1">
                  {errors.admin_password.message as string}
                </div>
              )}
              <p className="text-[11px] text-gray-500 mt-1">
                لو تركتها فارغة، السيرفر ممكن يولّد كلمة مرور عشوائية (حسب ما برمجناه في الباك إند).
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="sm:col-span-2 mt-2 flex gap-2">
        <Button disabled={!!submitting} type="submit">
          حفظ
        </Button>
        <Button type="button" variant="outline" onClick={() => reset()}>
          إعادة ضبط
        </Button>
      </div>
    </form>
  )
}
