import { useEffect, useMemo, useState } from "react"
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd"
import { Loader2, Users } from "lucide-react"
import { toast } from "sonner"

import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listCircles, listCircleStudents, type Circle } from "@/services/circles"
import { transferStudentCircle } from "@/services/students"
import { cn } from "@/lib/utils"

type BoardStudent = {
  id: number
  name: string
  levelName: string
  avatarUrl?: string | null
}

type BoardColumns = Record<number, BoardStudent[]>

function resolveLevelName(student: any): string {
  return (
    student?.level?.name ??
    student?.level_name ??
    student?.levelTitle ??
    student?.level ??
    "غير محدد"
  )
}

function resolveAvatarUrl(student: any): string | null {
  return (
    student?.avatar_url ??
    student?.avatar ??
    student?.photo_url ??
    student?.profile_photo_url ??
    student?.image_url ??
    null
  )
}

function initials(name: string): string {
  const trimmed = String(name || "").trim()
  if (!trimmed) return "؟"
  const parts = trimmed.split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase()
}

function AvatarBadge({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-10 w-10 rounded-full border border-slate-200 object-cover"
      />
    )
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-emerald-50 text-sm font-bold text-emerald-800">
      {initials(name)}
    </div>
  )
}

export default function CircleBoard() {
  const [circles, setCircles] = useState<Circle[]>([])
  const [columns, setColumns] = useState<BoardColumns>({})
  const [loading, setLoading] = useState(true)
  const [movingStudentId, setMovingStudentId] = useState<number | null>(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const circlesRes = await listCircles({ per_page: 1000 })
        const allCircles = circlesRes?.data ?? []
        setCircles(allCircles)

        const studentsByCircle = await Promise.all(
          allCircles.map(async (circle) => {
            const students = await listCircleStudents(Number(circle.id))
            const mapped: BoardStudent[] = students.map((student: any) => ({
              id: Number(student.id),
              name: String(student.name ?? "").trim() || "طالب بدون اسم",
              levelName: resolveLevelName(student),
              avatarUrl: resolveAvatarUrl(student),
            }))
            return { circleId: Number(circle.id), students: mapped }
          }),
        )

        const nextColumns: BoardColumns = {}
        studentsByCircle.forEach((entry) => {
          nextColumns[entry.circleId] = entry.students
        })
        setColumns(nextColumns)
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "تعذر تحميل لوحة الحلقات")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const totalStudents = useMemo(
    () => Object.values(columns).reduce((sum, list) => sum + list.length, 0),
    [columns],
  )

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return

    const fromId = Number(source.droppableId)
    const toId = Number(destination.droppableId)
    if (!Number.isFinite(fromId) || !Number.isFinite(toId)) return

    if (fromId === toId && source.index === destination.index) return

    const snapshotBeforeMove = columns
    const sourceCards = [...(columns[fromId] ?? [])]
    const destinationCards = fromId === toId ? sourceCards : [...(columns[toId] ?? [])]

    const [movedCard] = sourceCards.splice(source.index, 1)
    if (!movedCard) return

    destinationCards.splice(destination.index, 0, movedCard)

    const optimisticColumns: BoardColumns = {
      ...columns,
      [fromId]: sourceCards,
      [toId]: destinationCards,
    }
    setColumns(optimisticColumns)

    const studentId = Number(draggableId)
    if (!Number.isFinite(studentId)) return

    setMovingStudentId(studentId)
    try {
      await transferStudentCircle({
        student_id: studentId,
        from_circle_id: fromId,
        to_circle_id: toId,
      })
      toast.success("تم نقل الطالب بنجاح")
    } catch (error: any) {
      setColumns(snapshotBeforeMove)
      toast.error(error?.response?.data?.message || "فشل نقل الطالب، تم التراجع عن العملية")
    } finally {
      setMovingStudentId(null)
    }
  }

  return (
    <AppLayout>
      <Header
        title="لوحة نقل الطلاب بين الحلقات"
        subtitle="اسحب بطاقة الطالب وأسقطها على الحلقة المستهدفة لتحديث الدائرة مباشرة"
      />

      <div dir="rtl" className="space-y-4 px-4 pb-8 sm:px-6">
        <Card className="border-emerald-100 bg-gradient-to-b from-emerald-50 to-white">
          <CardContent className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            <div className="rounded-xl border border-emerald-100 bg-white p-3">
              <div className="text-xs text-slate-600">عدد الحلقات</div>
              <div className="mt-1 text-2xl font-black text-emerald-900">{circles.length}</div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-white p-3">
              <div className="text-xs text-slate-600">إجمالي الطلاب</div>
              <div className="mt-1 text-2xl font-black text-emerald-900">{totalStudents}</div>
            </div>
            <div className="col-span-2 rounded-xl border border-emerald-100 bg-white p-3">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Users className="h-4 w-4" />
                <span>يمكنك إعادة ترتيب الطلبة داخل نفس الحلقة أو نقلهم بين الحلقات.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-2xl border bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="overflow-x-auto pb-2">
              <div className="grid min-w-[900px] grid-cols-1 gap-4 pb-3 md:grid-cols-2 xl:grid-cols-3">
                {circles.map((circle) => {
                  const circleId = Number(circle.id)
                  const students = columns[circleId] ?? []

                  return (
                    <Droppable key={circleId} droppableId={String(circleId)}>
                      {(dropProvided, dropSnapshot) => (
                        <Card
                          ref={dropProvided.innerRef}
                          {...dropProvided.droppableProps}
                          className={cn(
                            "flex min-h-[360px] flex-col border-2 bg-white/90 transition",
                            dropSnapshot.isDraggingOver
                              ? "border-emerald-500 ring-2 ring-emerald-200"
                              : "border-emerald-100",
                          )}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-base">
                              <span>{circle.name}</span>
                              <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-900">
                                {students.length}
                              </span>
                            </CardTitle>
                          </CardHeader>

                          <CardContent className="flex-1 space-y-2">
                            {students.map((student, index) => {
                              const isSaving = movingStudentId === student.id

                              return (
                                <Draggable
                                  key={student.id}
                                  draggableId={String(student.id)}
                                  index={index}
                                >
                                  {(dragProvided, dragSnapshot) => (
                                    <div
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      {...dragProvided.dragHandleProps}
                                      className={cn(
                                        "rounded-xl border bg-white p-3 shadow-sm transition",
                                        dragSnapshot.isDragging
                                          ? "border-emerald-500 shadow-lg"
                                          : "border-slate-200",
                                        isSaving && "opacity-70",
                                      )}
                                    >
                                      <div className="flex items-center gap-3">
                                        <AvatarBadge name={student.name} avatarUrl={student.avatarUrl} />

                                        <div className="min-w-0 flex-1">
                                          <div className="truncate text-sm font-semibold text-slate-900">
                                            {student.name}
                                          </div>
                                          <div className="text-xs text-slate-600">
                                            المستوى: {student.levelName}
                                          </div>
                                        </div>

                                        {isSaving && <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              )
                            })}

                            {dropProvided.placeholder}

                            {!students.length && (
                              <div className="rounded-xl border border-dashed border-slate-300 px-3 py-8 text-center text-sm text-slate-500">
                                لا يوجد طلاب في هذه الحلقة
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </Droppable>
                  )
                })}
              </div>
            </div>
          </DragDropContext>
        )}
      </div>
    </AppLayout>
  )
}
