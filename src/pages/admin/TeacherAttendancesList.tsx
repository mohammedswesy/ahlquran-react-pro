import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"

export default function TeacherAttendancesList() {
    return (
        <AppLayout>
            <Header title="مواظبة المعلمين" subtitle="إدارة حضور وغياب المعلمين" />
            <div className="p-4">
                صفحة مواظبة المعلمين
            </div>
        </AppLayout>
    )
}
