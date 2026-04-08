// src/routes/guards.tsx
import { Navigate, Outlet } from "react-router-dom"
import { useAuth, type Role } from "@/store/auth"

export function ProtectedRoute() {
    const token = useAuth((s) => s.token)

    const lsToken =
        typeof window !== "undefined" ? localStorage.getItem("token") : null

    const hasToken = token || lsToken

    return hasToken ? <Outlet /> : <Navigate to="/login" replace />
}

export function RoleGuard({ allow }: { allow: Role[] }) {
    const role = useAuth((s) => s.role)

    if (!role) {
        return <Navigate to="/login" replace />
    }

    if (!allow.includes(role)) {
        const dashboardByRole: Record<Role, string> = {
            "super-admin": "/admin",
            "org-admin": "/admin",
            "institute-admin": "/institute/dashboard",
            "sub-admin": "/institute/dashboard",
            teacher: "/teacher/dashboard",
            student: "/student",
            parent: "/parent",
            employee: "/employee/dashboard",
        }

        const fallback = dashboardByRole[role]
        return <Navigate to={fallback || "/unauthorized"} replace />
    }

    return <Outlet />
}
