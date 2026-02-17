// src/services/api.ts
import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios"
import { toast } from "sonner"

/** إعدادات عامة */
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"
const TOKEN_KEY = "token"

/** دوال مساعدة للتوكن */
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

/** إنشاء instance موحّد */
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: false,
  timeout: 20000,
})

/** Request Interceptor: إضافة التوكن والـ headers */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token: string | null = getToken()

 
  config.headers = config.headers ?? ({} as any)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }


  config.headers.Accept = "application/json"

  return config
})


type ApiErrorPayload = {
  success?: boolean
  status?: "error" | "fail"
  message?: string
  errors?: Record<string, string[] | string>
}

/** Response Interceptor: توحيد الأخطاء + التوست + 401/419 */
let isHandling401 = false

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    // لا يوجد response → غالبًا مشكلة نتورك
    if (!error.response) {
      toast.error("تعذّر الاتصال بالخادم. تأكّد من الاتصال بالإنترنت.")
      return Promise.reject(error)
    }

    const { status, data } = error.response
    const message = data?.message || "حدث خطأ غير متوقع."

    // 401 أو 419 → جلسة منتهية / توكن منتهي
    if ((status === 401 || status === 419) && !isHandling401) {
      isHandling401 = true
      try {
        toast.error("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.")
        clearToken()
        localStorage.removeItem("role")
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
      } finally {
        isHandling401 = false
      }
      return Promise.reject(error)
    }

    // 403 → بدون صلاحيات
    if (status === 403) {
      toast.error("ليست لديك صلاحية لتنفيذ هذه العملية.")
      return Promise.reject(error)
    }

    // 422 → أخطاء تحقق (Validation)
    if (status === 422 && data?.errors) {
      const rawErrors = Object.values(data.errors)
      const flattened = rawErrors
        .flat()
        .map((e) => String(e))

      const first = flattened[0] || message
      toast.error(first)
        ; (error as any).isValidationError = true
        ; (error as any).validationErrors = data.errors

      return Promise.reject(error)
    }

    // 404 → العنصر مش موجود
    if (status === 404) {
      toast.error("العنصر المطلوب غير موجود.")
      return Promise.reject(error)
    }

    // باقي الحالات (500، 400، إلخ)
    toast.error(message)

    return Promise.reject(error)
  }
)

export default api
