import { useState } from "react"
import { Link } from "react-router-dom"
import { BRAND } from "@/config/brand"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { requestPasswordReset } from "@/services/auth"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email.trim()) return setError("البريد الإلكتروني مطلوب")

    try {
      setLoading(true)
      await requestPasswordReset(email)
      setSuccess("تم إرسال رابط إعادة التعيين (إذا كان البريد موجودًا لدينا).")
    } catch (e: any) {
      setError(e?.response?.data?.message || "تعذر إرسال الطلب. حاول مرة أخرى.")
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
          <h1 className="text-2xl font-bold">استعادة كلمة المرور</h1>
          <p className="mt-1 text-white/80 text-sm">أدخل بريدك وسنرسل لك رابط إعادة تعيين</p>
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

            <Input
              label="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
            />

            <Button disabled={loading} className="mt-1">
              {loading ? "جارٍ الإرسال…" : "إرسال رابط الاستعادة"}
            </Button>

            <div className="text-sm text-gray-600 flex items-center justify-between">
              <Link to="/login" className="hover:underline">
                رجوع لتسجيل الدخول
              </Link>
              <Link to="/register" className="text-[var(--primary)] hover:underline">
                إنشاء حساب طالب
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
