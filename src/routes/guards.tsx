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
        return <Navigate to="/unauthorized" replace />
    }

    return <Outlet />
}
