import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { BRAND } from "@/config/brand"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { registerStudent } from "@/services/auth"

export default function RegisterStudent() {
  const nav = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("")
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!name.trim()) return setError("الاسم مطلوب")
    if (!email.trim()) return setError("البريد الإلكتروني مطلوب")
    if (!password) return setError("كلمة المرور مطلوبة")
    if (password.length < 8) return setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    if (password !== password2) return setError("تأكيد كلمة المرور غير مطابق")

    try {
      setLoading(true)
      await registerStudent({ name, email, mobile: mobile || undefined, password, password_confirmation: password2 })
      setSuccess("تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول الآن.")
      setTimeout(() => nav("/login"), 400)
    } catch (e: any) {
      setError(e?.response?.data?.message || "تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[linear-gradient(135deg,var(--primary),#111827)] px-4">
      <div className="w-full max-w-md" dir="rtl">
        <div className="mb-4 text-center text-white">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-white/10 grid place-items-center text-lg font-bold">
            {BRAND.shortName}
          </div>
          <h1 className="text-2xl font-bold">إنشاء حساب طالب</h1>
          <p className="mt-1 text-white/80 text-sm">سجّل بياناتك لبدء استخدام المنصة</p>
        </div>

        <Card className="p-6 rounded-2xl shadow-xl bg-white/95">
          <form onSubmit={onSubmit} className="grid gap-3">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {success}
              </div>
            )}

            <Input label="الاسم" value={name} onChange={(e) => setName(e.target.value)} placeholder="محمد" />
            <Input
              label="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
            />
            <Input
              label="الجوال (اختياري)"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="059xxxxxxx"
              autoComplete="tel"
            />
            <Input
              label="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="new-password"
            />
            <Input
              label="تأكيد كلمة المرور"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="new-password"
            />

            <Button disabled={loading} className="mt-1">
              {loading ? "جارٍ الإنشاء…" : "إنشاء الحساب"}
            </Button>

            <div className="text-sm text-gray-600 flex items-center justify-between">
              <Link to="/login" className="hover:underline">
                عندك حساب؟ تسجيل دخول
              </Link>
              <Link to="/forgot-password" className="text-[var(--primary)] hover:underline">
                نسيت كلمة المرور
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
