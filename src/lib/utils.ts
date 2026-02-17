// src/lib/utils.ts
// دمج كلاسات Tailwind بأمان (بدون تبعيات خارجية)
export function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ")
}
