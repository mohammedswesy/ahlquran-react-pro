import React from "react"
import Sidebar from "./Sidebar"
import Header from "@/components/ui/Header"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "var(--bg-grad)" }}>
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="flex-1 min-w-0 h-screen flex flex-col">
          <Header
            title="منصة AhlQuran"
            subtitle="نظام إدارة حلقات القرآن الشاملة"
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
