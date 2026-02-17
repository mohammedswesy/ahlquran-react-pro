import { Link } from "react-router-dom"
import { PageHeader } from "@/components/ui/page"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useAuth, type Role } from "@/store/auth"
import { User, Lock, School, SlidersHorizontal } from "lucide-react"

type Item = {
    title: string
    desc: string
    to: string
    icon: any
    show: boolean
}

export default function SettingsHome() {
    const role = useAuth((s) => s.role as Role | null)

    const items: Item[] = [
        {
            title: "إعدادات الحساب",
            desc: "تعديل الاسم، البريد، رقم الجوال",
            to: "/settings/profile",
            icon: User,
            show: true,
        },
        {
            title: "الأمان",
            desc: "تغيير كلمة المرور وإعدادات الأمان",
            to: "/settings/security",
            icon: Lock,
            show: true,
        },
        {
            title: "إعدادات المعهد",
            desc: "إعدادات خاصة بالمعهد وإدارته",
            to: "/settings/institute",
            icon: School,
            show: role === "institute-admin" || role === "sub-admin",
        },
        {
            title: "إعدادات النظام",
            desc: "إعدادات عامة للنظام (Super Admin)",
            to: "/settings/system",
            icon: SlidersHorizontal,
            show: role === "super-admin",
        },
    ]

    return (
        <div className="p-4 sm:p-6" dir="rtl">
            <PageHeader title="الإعدادات" subtitle="اختر نوع الإعدادات التي تريد تعديلها" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.filter(i => i.show).map((i) => {
                    const Icon = i.icon
                    return (
                        <Link key={i.to} to={i.to} className="block">
                            <Card className="rounded-[28px] hover:translate-y-[-1px] transition-all shadow-[var(--shadow2)]">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-2xl p-3 border border-[var(--border)] bg-[rgba(0,61,53,.08)]">
                                            <Icon size={20} className="text-[var(--text)]" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-extrabold text-[var(--text)]">{i.title}</div>
                                            <div className="text-xs text-[var(--muted)] mt-1">{i.desc}</div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="text-xs opacity-70">فتح</CardContent>
                            </Card>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
    