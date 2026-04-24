import React from "react"
import Sidebar from "./Sidebar"
import Header from "@/components/ui/Header"
import { useAuth } from "@/store/auth"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const role = useAuth((s) => s.role)
  const instituteName = useAuth((s) => s.instituteName)
  const brandName = useAuth((s) => s.brandName)

  const title = instituteName || brandName
  const subtitle =
    role === "super-admin"
      ? "Global Control Center"
      : instituteName
      ? `لوحة ${instituteName}`
      : "نظام إدارة حلقات القرآن الكريم الشامل"

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "var(--bg-grad)" }}>
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="flex-1 min-w-0 h-screen flex flex-col">
          <Header
            title={title}
            subtitle={subtitle}
            hideLogout={false}
          />

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
