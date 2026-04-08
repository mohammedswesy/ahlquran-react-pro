import { lazy, Suspense } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { ProtectedRoute, RoleGuard } from "./guards"

const Login = lazy(() => import("@/pages/auth/Login"))
const Unauthorized = lazy(() => import("@/pages/auth/Unauthorized"))

const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"))
const TeacherDashboard = lazy(() => import("@/pages/teacher/Dashboard"))
const StudentDashboard = lazy(() => import("@/pages/student/Dashboard"))
const ParentDashboard = lazy(() => import("@/pages/parent/Dashboard"))
const EmployeeDashboard = lazy(() => import("@/pages/employee/Dashboard"))
const InstituteAdminDashboardPage = lazy(() => import("@/pages/institute/InstituteAdminDashboardPage"))

const InstitutesList = lazy(() => import("@/pages/admin/InstitutesList"))
const OrganizationsList = lazy(() => import("@/pages/admin/OrganizationsList"))
const EmployeesList = lazy(() => import("@/pages/admin/EmployeesList"))
const CirclesList = lazy(() => import("@/pages/admin/CirclesList"))
const CircleForm = lazy(() => import("@/pages/admin/CircleForm"))
const StudentsList = lazy(() => import("@/pages/admin/StudentsList"))
const ParentsList = lazy(() => import("@/pages/admin/ParentsList"))
const NotificationsList = lazy(() => import("@/pages/admin/NotificationsList"))
const TeachersList = lazy(() => import("@/pages/admin/TeachersList"))
const ParentCreate = lazy(() => import("@/pages/admin/ParentCreate"))
const ParentShow = lazy(() => import("@/pages/admin/ParentShow"))
const ParentEdit = lazy(() => import("@/pages/admin/ParentEdit"))
const EmployeeAttendancePage = lazy(() => import("@/pages/admin/EmployeeAttendancePage"))
const TeacherAttendancesList = lazy(() => import("@/pages/admin/TeacherAttendancesList"))
const AttendancesList = lazy(() => import("@/pages/admin/AttendancesList"))
const AdminReports = lazy(() => import("@/pages/admin/Reports"))
const EnrollmentsList = lazy(() => import("@/pages/admin/EnrollmentsList"))
const EnrollmentForm = lazy(() => import("@/pages/admin/EnrollmentForm"))
const BillingsList = lazy(() => import("@/pages/admin/BillingsList"))

const MyCircles = lazy(() => import("@/pages/teacher/MyCircles"))
const TakeAttendance = lazy(() => import("@/pages/teacher/TakeAttendance"))
const Assessments = lazy(() => import("@/pages/teacher/Assessments"))
const Memorization = lazy(() => import("@/pages/teacher/Memorization"))
const Reviews = lazy(() => import("@/pages/teacher/Reviews"))

const MyProgress = lazy(() => import("@/pages/student/MyProgress"))
const MySchedule = lazy(() => import("@/pages/student/MySchedule"))

const Children = lazy(() => import("@/pages/parent/Children"))
const ParentReports = lazy(() => import("@/pages/parent/Reports"))

const Tasks = lazy(() => import("@/pages/employee/Tasks"))
const People = lazy(() => import("@/pages/employee/People"))

const SettingsHome = lazy(() => import("@/pages/settings/SettingsHome"))
const ProfileSettings = lazy(() => import("@/pages/settings/ProfileSettings"))
const SecuritySettings = lazy(() => import("@/pages/settings/SecuritySettings"))
const InstituteSettings = lazy(() => import("@/pages/settings/InstituteSettings"))
const SystemSettings = lazy(() => import("@/pages/settings/SystemSettings"))

const LibraryCategoriesPage = lazy(() => import("@/pages/library/admin/LibraryCategoriesPage"))
const LibrarySubCategoriesPage = lazy(() => import("@/pages/library/admin/LibrarySubCategoriesPage"))
const LibraryItemsPage = lazy(() => import("@/pages/library/admin/LibraryItemsPage"))
const LibraryItemFormPage = lazy(() => import("@/pages/admin/LibraryItemFormPage"))


export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="p-4 text-right" dir="rtl">جاري تحميل الصفحة...</div>}>
      <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={<ProtectedRoute />}>
        {/* =========================
            SETTINGS (Group)
            ========================= */}
        <Route path="/settings" element={<SettingsHome />} />
        <Route path="/settings/profile" element={<ProfileSettings />} />
        <Route path="/settings/security" element={<SecuritySettings />} />

        {/* Institute Settings (Institute Admin فقط) */}
        <Route element={<RoleGuard allow={["institute-admin", "sub-admin"]} />}>
          <Route path="/settings/institute" element={<InstituteSettings />} />
        </Route>

        {/* System Settings (Super Admin فقط) */}
        <Route element={<RoleGuard allow={["super-admin"]} />}>
          <Route path="/settings/system" element={<SystemSettings />} />
        </Route>

        {/* =========================
            ADMIN (كل الأدمنز)
            ========================= */}
        <Route element={<RoleGuard allow={["super-admin", "org-admin", "institute-admin", "sub-admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/dashboard/memorization" element={<Navigate to="/admin/reports" replace />} />
          <Route path="/dashboard/attendance" element={<Navigate to="/admin/attendance" replace />} />
          <Route path="/dashboard/evaluations" element={<Navigate to="/admin/reports" replace />} />
          <Route path="/dashboard/staff-monitoring" element={<Navigate to="/admin/employee-attendance" replace />} />

          <Route path="/admin/teacher-attendance" element={<TeacherAttendancesList />} />
          <Route path="/admin/attendance" element={<AttendancesList />} />
          <Route path="/admin/employee-attendance" element={<EmployeeAttendancePage />} />
          <Route path="/admin/reports" element={<AdminReports />} />

          <Route path="/admin/circles" element={<CirclesList />} />
          <Route path="/admin/circles/new" element={<CircleForm />} />
          <Route path="/admin/circles/:id" element={<CircleForm />} />

          <Route path="/admin/students" element={<StudentsList />} />
          <Route path="/admin/enrollments" element={<EnrollmentsList />} />
          <Route path="/admin/enrollments/new" element={<EnrollmentForm />} />
          <Route path="/admin/enrollments/:id/edit" element={<EnrollmentForm />} />
          <Route path="/admin/billings" element={<BillingsList />} />

          <Route path="/admin/parents" element={<ParentsList />} />
          <Route path="/admin/parents/create" element={<ParentCreate />} />
          <Route path="/admin/parents/:id" element={<ParentShow />} />
          <Route path="/admin/parents/:id/edit" element={<ParentEdit />} />

          <Route path="/admin/teachers" element={<TeachersList />} />

          <Route path="/admin/library" element={<LibraryItemsPage />} />
          <Route path="/admin/library/categories" element={<LibraryCategoriesPage />} />
          <Route path="/admin/library/sub-categories" element={<LibrarySubCategoriesPage />} />
          <Route path="/admin/library/items" element={<LibraryItemsPage />} />
          <Route path="/admin/library/items/new" element={<LibraryItemFormPage />} />
          <Route path="/admin/library/items/:id/edit" element={<LibraryItemFormPage />} />

          <Route path="/admin/notifications" element={<NotificationsList />} />
        </Route>

        {/* =========================
            SUPER ADMIN ONLY
            ========================= */}
        <Route element={<RoleGuard allow={["super-admin"]} />}>
          <Route path="/admin/institutes" element={<InstitutesList />} />
          <Route path="/admin/organizations" element={<OrganizationsList />} />
          <Route path="/admin/employees" element={<EmployeesList />} />
        </Route>

        {/* =========================
            Institute Admin Dashboard
            ========================= */}
        <Route element={<RoleGuard allow={["institute-admin", "sub-admin"]} />}>
          <Route path="/institute/dashboard" element={<InstituteAdminDashboardPage />} />
        </Route>

        {/* =========================
            Teacher
            ========================= */}
        <Route element={<RoleGuard allow={["teacher"]} />}>
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/circles" element={<MyCircles />} />
          <Route path="/teacher/attendance" element={<TakeAttendance />} />
          <Route path="/teacher/assessments" element={<Assessments />} />
          <Route path="/teacher/memorization" element={<Memorization />} />
          <Route path="/teacher/reviews" element={<Reviews />} />
        </Route>

        {/* =========================
            Student
            ========================= */}
        <Route element={<RoleGuard allow={["student"]} />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/progress" element={<MyProgress />} />
          <Route path="/student/schedule" element={<MySchedule />} />
        </Route>

        {/* =========================
            Parent
            ========================= */}
        <Route element={<RoleGuard allow={["parent"]} />}>
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/parent/children" element={<Children />} />
          <Route path="/parent/reports" element={<ParentReports />} />
        </Route>

        {/* =========================
            Employee
            ========================= */}
        <Route element={<RoleGuard allow={["employee"]} />}>
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee/tasks" element={<Tasks />} />
          <Route path="/employee/people" element={<People />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}
