import Sidebar from "./Sidebar"
import Header from "./Header"

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex">
            <Sidebar />
   
            <div className="flex-1 flex flex-col min-w-0">
                <Header title="AhlQuran" subtitle="نظام إدارة حلقات القرآن" hideLogout />
                <main className="p-4 sm:p-6 max-w-7xl mx-auto w-full">{children}</main>
            </div>
        </div>
    )
}
