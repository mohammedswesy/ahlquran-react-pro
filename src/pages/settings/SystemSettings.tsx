import { PageHeader } from "@/components/ui/page"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function SystemSettings() {
    return (
        <div className="p-4 sm:p-6">
            <PageHeader title="إعدادات النظام" subtitle="قريبًا: إعدادات عامة للنظام (Super Admin)" />
            <Card className="rounded-[28px]">
                <CardHeader className="pb-2">
                    <div className="text-base font-bold">قريبًا</div>
                </CardHeader>
                <CardContent className="opacity-70">هذه الصفحة Placeholder، وسنربطها بالباك في الخطوة القادمة.</CardContent>
            </Card>
        </div>
    )
}
