import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { login } from "@/services/auth"
import { useAuth, type Role } from "@/store/auth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PiLock } from "react-icons/pi"
import { toast } from "sonner"

export default function Login() {
  const [email, setEmail] = useState("admin@ahlquran.test")
  const [password, setPassword] = useState("12345678")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nav = useNavigate()
  const { setAuth, token, role } = useAuth()

  const redirectByRole = (currentRole: Role) => {
    if (currentRole === "teacher") nav("/teacher/dashboard")
    else if (currentRole === "parent") nav("/parent")
    else if (currentRole === "employee") nav("/employee/dashboard")
    else if (currentRole === "student") nav("/student")
    else if (currentRole === "institute-admin" || currentRole === "sub-admin") nav("/institute/dashboard")
    else nav("/admin")
  }

  useEffect(() => {
    if (token && role) {
      redirectByRole(role)
    }
  }, [token, role])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)

      const { token, role, tenant } = await login({ email, password })
      const r = (role as Role) || null
      const authToken = typeof token === "string" ? token : ""

      if (!authToken || !r) {
        setError("تعذر تحديد صلاحية المستخدم")
        return
      }

      setAuth({ token: authToken, role: r, tenant })
      redirectByRole(r)
    } catch (e: any) {
      const message = e?.response?.data?.message || "فشل تسجيل الدخول"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Animated background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--brand2)] rounded-full blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--brand)] rounded-full blur-3xl opacity-5 animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Main card */}
        <div
          className="rounded-3xl border border-[var(--border)] overflow-hidden"
          style={{
            background: "rgba(254, 254, 254, 0.95)",
            boxShadow: "0 25px 50px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 0, 0, 0.1)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Header accent bar */}
          <div
            className="h-1 w-full"
            style={{
              background: "linear-gradient(90deg, var(--brand) 0%, var(--brand2) 100%)",
            }}
          />

          <div className="p-8 sm:p-10">
            {/* Logo & Title Section */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "rgba(0, 61, 53, 0.08)" }}>
                <PiLock className="text-2xl" style={{ color: "var(--brand)" }} />
              </div>

              <h1 className="text-3xl font-extrabold mb-2 tracking-tight" style={{ color: "var(--text)" }}>
                معاهد الخليل لتعليم القرآن الكريم
              </h1>

              <p className="text-sm" style={{ color: "var(--muted)" }}>
                تسجيل دخول آمن لوحة التحكم
              </p>
            </div>

            {/* Form Section */}
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Error Alert */}
              {error && (
                <div
                  className="rounded-xl border px-4 py-3 text-sm"
                  style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    borderColor: "rgba(239, 68, 68, 0.2)",
                    color: "#dc2626",
                  }}
                >
                  <div className="font-semibold mb-1">خطأ في المصادقة</div>
                  <div>{error}</div>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{  color: "var(--text)" }}>
                  البريد الإلكتروني
                </label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ahlquran.test"
                  type="email"
                  disabled={loading}
                  className="w-full"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>
                  كلمة المرور
                </label>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type="password"
                  disabled={loading}
                  className="w-full"
                />
              </div>

              {/* Submit Button */}
              <Button
                disabled={loading}
                className="w-full mt-6 py-2.5 font-semibold text-base relative overflow-hidden"
                style={{
                  background: `var(--brand)`,
                  color: "white",
                  boxShadow: "0 8px 16px rgba(0, 61, 53, 0.2)",
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      جارٍ الدخول...
                    </>
                  ) : (
                    "دخول"
                  )}
                </span>
              </Button>

              {/* Helper Text */}
              <div className="text-xs text-center" style={{ color: "var(--muted)" }}>
                سيتم توجيهك تلقائياً حسب صلاحياتك (إدارة / معلم / طالب / موظف / ولي أمر)
              </div>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
                © 2026 معاهد الخليل لتعليم القرآن الكريم. جميع الحقوق محفوظة.
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 rounded-xl border border-[var(--border)]" style={{ background: "rgba(0, 61, 53, 0.03)" }}>
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
            <strong>حساب تجريبي:</strong> استخدم البيانات المدرجة سلفاً للدخول. هذا الحساب تجريبي فقط ولأغراض العرض التوضيحي.
          </p>
        </div>
      </div>
    </div>
  )
}
