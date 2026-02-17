import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { login } from "@/services/auth"
import { useAuth, type Role } from "@/store/auth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function Login() {
  const [email, setEmail] = useState("admin@ahlquran.test")
  const [password, setPassword] = useState("12345678")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nav = useNavigate()
  const { setToken, setRole, token, role } = useAuth()

  useEffect(() => {
    if (token && role) {
      if (role === "teacher") nav("/teacher")
      else if (role === "parent") nav("/parent")
      else if (role === "employee") nav("/employee")
      else if (role === "student") nav("/student")
      else if (role === "institute-admin" || role === "sub-admin") nav("/institute/dashboard")
      else nav("/admin")
    }
  }, [token, role])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)

      const { token, role } = await login({ email, password })
      const r = (role as Role) || "super-admin"

      setToken(token)
      setRole(r)

      if (r === "teacher") nav("/teacher")
      else if (r === "parent") nav("/parent")
      else if (r === "employee") nav("/employee")
      else if (r === "student") nav("/student")
      else if (r === "institute-admin" || r === "sub-admin") nav("/institute/dashboard")
      else nav("/admin")
    } catch (e: any) {
      setError(e?.response?.data?.message || "فشل تسجيل الدخول")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div
        className="w-full max-w-md rounded-[28px] border border-[var(--border)] p-6"
        style={{ background: "rgba(255,255,255,.06)", backdropFilter: "blur(14px)", boxShadow: "var(--shadow)" }}
      >
        <div className="mb-6 text-center">
          <div className="text-2xl font-extrabold tracking-wide">
            <span className="opacity-90">Nebula</span>{" "}
            <span className="bg-[linear-gradient(135deg,var(--brand),var(--brand2))] bg-clip-text text-transparent">
              Quran
            </span>
          </div>
          <div className="text-xs text-[var(--muted)] mt-1">تسجيل دخول آمن للوصول للوحة التحكم</div>
        </div>

        <form onSubmit={onSubmit} className="grid gap-3" dir="rtl">
          {error && (
            <div className="text-sm rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
              {error}
            </div>
          )}

          <Input
            label="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />

          <Input
            label="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            type="password"
          />

          <Button disabled={loading} className="mt-2">
            {loading ? "جارٍ الدخول..." : "دخول"}
          </Button>

          <div className="text-xs text-[var(--muted)] text-center mt-2">
            سيتم توجيهك تلقائياً حسب الصلاحية (Admin / Teacher / Student)
          </div>
        </form>
      </div>
    </div>
  )
}
