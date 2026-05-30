import * as XLSX from "xlsx";
import type { ActivityStudentsExport } from "@/types/domain";

function gradeStatusLabel(status: string): string {
  return status === "taken" ? "تم الأداء" : "لم يتم الأداء";
}

function buildExportRows(data: ActivityStudentsExport): Array<Array<string | number>> {
  const baseHeaders = [
    "الاسم",
    "المجموعة",
    "الهاتف",
    "البريد",
    "جلسات حاضر",
    "إجمالي الجلسات",
    "غياب",
    "نسبة الحضور %",
    "درجات الجلسات",
    "الدرجات الإجمالية",
    "المجموع النهائي",
  ];

  const gradeHeaders = data.gradeColumns.flatMap((col) => [
    `${col.name} (درجة)`,
    `${col.name} (من)`,
    `${col.name} (الحالة)`,
  ]);

  const headers = [...baseHeaders, ...gradeHeaders];

  const rows = data.rows.map((row) => {
    const gradeMap = new Map(
      row.globalGradesSummary.map((g) => [g.gradeName, g])
    );

    const baseCells: Array<string | number> = [
      row.studentName,
      row.groupName,
      row.phone,
      row.email,
      row.sessionsPresent,
      row.totalSessions,
      row.sessionsAbsent,
      row.attendanceRate,
      row.totalSessionMark,
      row.totalGlobalMark,
      row.totalFinalMark,
    ];

    const gradeCells = data.gradeColumns.flatMap((col) => {
      const grade = gradeMap.get(col.name);
      return [
        grade?.mark ?? 0,
        grade?.fullMark ?? col.fullMark,
        grade ? gradeStatusLabel(grade.status) : "لم يتم الأداء",
      ];
    });

    return [...baseCells, ...gradeCells];
  });

  return [headers, ...rows];
}

export function downloadStudentsExportXlsx(
  data: ActivityStudentsExport,
  filename?: string
): void {
  const sheetData = buildExportRows(data);
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  worksheet["!cols"] = sheetData[0].map((header) => ({
    wch: Math.max(14, String(header).length + 4),
  }));

  worksheet["!sheetViews"] = [{ rightToLeft: true }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "الطلاب");

  if (!workbook.Workbook) workbook.Workbook = {};
  if (!workbook.Workbook.Views) workbook.Workbook.Views = [];
  workbook.Workbook.Views[0] = { RTL: true };

  const safeName = (filename || data.activityName).replace(
    /[^\w\u0600-\u06FF\s-]/g,
    ""
  );

  XLSX.writeFile(workbook, `${safeName}-students-export.xlsx`, {
    bookType: "xlsx",
    type: "binary",
  });
}

/** @deprecated Use downloadStudentsExportXlsx */
export const downloadStudentsExportCsv = downloadStudentsExportXlsx;
