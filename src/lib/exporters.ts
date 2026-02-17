// src/lib/exporters.ts

// لا يحتاج حزم خارجية للـ CSV
export function toCSV<T extends Record<string, any>>(rows: T[], filename = "export.csv") {
    const safe = Array.isArray(rows) ? rows : [];
    if (!safe.length) {
        const blob = new Blob([""], { type: "text/csv;charset=utf-8;" });
        triggerDownload(blob, filename);
        return;
    }

    const headers = Object.keys(safe[0] ?? {});
    const escape = (val: any) => {
        const s = (val ?? "").toString().replace(/"/g, '""');
        return s.includes(",") || s.includes("\n") || s.includes('"') ? `"${s}"` : s;
    };

    const lines = [
        headers.join(","),
        ...safe.map(r => headers.map(h => escape(r[h])).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, filename);
}

// يتطلب تثبيت sheetjs:  npm i xlsx
export async function toXLSX<T extends Record<string, any>>(rows: T[], filename = "export.xlsx") {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(rows || []);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    triggerDownload(blob, filename);
}

// طباعة/تصدير PDF لجزء محدد من الصفحة (يفتح نافذة طباعة المتصفح)
export function printSection(html: string, title = "تقرير") {
    const w = window.open("", "_blank", "width=1024,height=768");
    if (!w) { window.print(); return; }
    w.document.write(`
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body { font-family: system-ui, -apple-system, Segoe UI, Tahoma, Arial; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; }
          th { background: #f6f6f6; }
          h2 { margin: 0 0 8px; }
          @media print { .no-print { display:none } }
        </style>
      </head>
      <body>
        ${html}
        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `);
    w.document.close();
}

function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
