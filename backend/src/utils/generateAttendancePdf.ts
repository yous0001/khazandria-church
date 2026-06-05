import PDFDocument from "pdfkit";
import { readAssetBuffer, resolveAsset } from "./assetPaths";
import { HttpError } from "./httpError";
import {
  formatPercent,
  arabicLabel,
  PDF_RTL_FEATURES,
} from "./arabicPdfText";

export interface AttendancePdfStudent {
  name: string;
  present: boolean;
  bonusMark: number;
}

export interface AttendancePdfData {
  activityName: string;
  groupName: string;
  sessionDate: Date;
  generatedBy: string;
  generatedAt: Date;
  students: AttendancePdfStudent[];
}

const COLORS = {
  primary: "#1e3a5f",
  primaryLight: "#2d5a8a",
  accent: "#c9a227",
  present: "#16a34a",
  presentBg: "#dcfce7",
  absent: "#dc2626",
  absentBg: "#fee2e2",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  rowAlt: "#f8fafc",
  white: "#ffffff",
};

function formatArabicDate(date: Date): string {
  return date.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatArabicDateTime(date: Date): string {
  return date.toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function writeRtl(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  x: number,
  y: number,
  options: {
    width?: number;
    align?: "left" | "center" | "right" | "justify";
    lineBreak?: boolean;
  }
): void {
  doc.text(text, x, y, {
    ...options,
    features: [...PDF_RTL_FEATURES],
  });
}

function writeNumber(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  x: number,
  y: number,
  options: {
    width?: number;
    align?: "left" | "center" | "right" | "justify";
  }
): void {
  doc.font("Helvetica-Bold").text(text, x, y, options);
}

export async function generateAttendancePdf(
  data: AttendancePdfData
): Promise<Buffer> {
  let regularFont: Buffer;
  let boldFont: Buffer;
  try {
    regularFont = readAssetBuffer("fonts", "NotoSansArabic-Regular.ttf");
    boldFont = readAssetBuffer("fonts", "NotoSansArabic-Bold.ttf");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Arabic fonts not found";
    throw new HttpError(500, "Arabic fonts not found for PDF generation", message);
  }

  const logoPath = resolveAsset("logo.png");

  const presentCount = data.students.filter((s) => s.present).length;
  const absentCount = data.students.length - presentCount;
  const attendanceRate =
    data.students.length > 0
      ? Math.round((presentCount / data.students.length) * 100)
      : 0;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.registerFont("Arabic", regularFont);
    doc.registerFont("Arabic-Bold", boldFont);

    const pageWidth = doc.page.width;
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;

    // Header
    doc.rect(0, 0, pageWidth, 112).fill(COLORS.primary);
    doc.rect(0, 108, pageWidth, 4).fill(COLORS.accent);

    if (logoPath) {
      doc.image(logoPath, margin, 20, { width: 72, height: 72 });
    }

    const headerTextX = margin + 88;
    const headerTextWidth = contentWidth - 88;

    doc.fillColor(COLORS.white);
    doc.font("Arabic-Bold").fontSize(18);
    writeRtl(doc, "كنيسة السيدة العذراء", headerTextX, 26, {
      width: headerTextWidth,
      align: "right",
    });
    doc.font("Arabic").fontSize(10);
    writeRtl(
      doc,
      "\u0644\u0644\u0623\u0642\u0628\u0627\u0637 \u0627\u0644\u0643\u0627\u062B\u0648\u0644\u064A\u0643 \u0628\u062C\u0632\u064A\u0631\u0629 \u0627\u0644\u062E\u0632\u0646\u062F\u0627\u0631\u064A\u0629",
      headerTextX,
      50,
      { width: headerTextWidth, align: "right" }
    );
    doc.font("Arabic-Bold").fontSize(12).fillColor(COLORS.accent);
    writeRtl(doc, "تقرير حضور الجلسة", margin, 82, {
      width: contentWidth,
      align: "right",
    });

    let y = 132;

    // Session info card
    doc.roundedRect(margin, y, contentWidth, 78, 10).fillAndStroke(
      COLORS.white,
      COLORS.border
    );

    doc.fillColor(COLORS.text).font("Arabic-Bold").fontSize(11);
    writeRtl(doc, arabicLabel("النشاط:", data.activityName), margin + 16, y + 14, {
      width: contentWidth - 32,
      align: "right",
    });
    doc.font("Arabic").fontSize(10).fillColor(COLORS.muted);
    writeRtl(doc, arabicLabel("المجموعة:", data.groupName), margin + 16, y + 34, {
      width: contentWidth - 32,
      align: "right",
    });
    writeRtl(
      doc,
      arabicLabel("تاريخ الجلسة:", formatArabicDate(data.sessionDate)),
      margin + 16,
      y + 52,
      { width: contentWidth - 32, align: "right" }
    );

    y += 94;

    // Stats — RTL order: present (right), absent, rate (left)
    const statWidth = (contentWidth - 24) / 3;
    const stats = [
      { label: "حاضر", value: String(presentCount), color: COLORS.present },
      { label: "غائب", value: String(absentCount), color: COLORS.absent },
      {
        label: "نسبة حضور المجموعة",
        value: formatPercent(attendanceRate),
        color: COLORS.primaryLight,
      },
    ];

    stats.forEach((stat, index) => {
      const rtlIndex = 2 - index;
      const x = margin + rtlIndex * (statWidth + 12);
      doc.roundedRect(x, y, statWidth, 64, 10).fillAndStroke(
        COLORS.white,
        COLORS.border
      );
      doc.fillColor(stat.color).font("Arabic-Bold").fontSize(22);
      writeNumber(doc, stat.value, x, y + 10, {
        width: statWidth,
        align: "center",
      });
      doc.font("Arabic-Bold");
      doc.fillColor(COLORS.muted).font("Arabic").fontSize(9);
      writeRtl(doc, stat.label, x, y + 40, {
        width: statWidth,
        align: "center",
      });
    });

    y += 84;

    // Table — columns RTL: name | status | bonus | #
    const colNum = 40;
    const colBonus = 72;
    const colStatus = 88;
    const colName = contentWidth - colNum - colBonus - colStatus;
    const colWidths = [colName, colStatus, colBonus, colNum];
    const colX = [
      margin,
      margin + colName,
      margin + colName + colStatus,
      margin + colName + colStatus + colBonus,
    ];
    const rowHeight = 32;

    const drawTableHeader = (startY: number) => {
      doc.roundedRect(margin, startY, contentWidth, rowHeight, 6).fill(
        COLORS.primary
      );
      doc.fillColor(COLORS.white).font("Arabic-Bold").fontSize(10);
      const headers = ["اسم الطالب", "الحالة", "المكافأة", "م"];
      headers.forEach((header, i) => {
        writeRtl(doc, header, colX[i] + 6, startY + 10, {
          width: colWidths[i] - 12,
          align: "center",
        });
      });
      doc.fillColor(COLORS.text);
      return startY + rowHeight + 4;
    };

    y = drawTableHeader(y);

    data.students.forEach((student, index) => {
      if (y + rowHeight > doc.page.height - 72) {
        doc.addPage();
        y = 48;
        y = drawTableHeader(y);
      }

      const bg = index % 2 === 0 ? COLORS.white : COLORS.rowAlt;
      doc.roundedRect(margin, y, contentWidth, rowHeight, 4).fillAndStroke(
        bg,
        COLORS.border
      );

      const displayName = student.name?.trim() || "—";
      doc.fillColor(COLORS.text).font("Arabic").fontSize(10);
      writeRtl(doc, displayName, colX[0] + 10, y + 10, {
        width: colWidths[0] - 20,
        align: "right",
      });

      const statusColor = student.present ? COLORS.present : COLORS.absent;
      const statusBg = student.present ? COLORS.presentBg : COLORS.absentBg;
      const statusLabel = student.present ? "حاضر" : "غائب";
      const badgeW = 52;
      const badgeX = colX[1] + (colWidths[1] - badgeW) / 2;
      doc.roundedRect(badgeX, y + 7, badgeW, 18, 9).fill(statusBg);
      doc.fillColor(statusColor).font("Arabic-Bold").fontSize(9);
      writeRtl(doc, statusLabel, badgeX, y + 11, {
        width: badgeW,
        align: "center",
      });

      doc.fillColor(COLORS.text).font("Arabic-Bold").fontSize(10);
      writeNumber(
        doc,
        student.present ? String(student.bonusMark) : "-",
        colX[2],
        y + 11,
        { width: colWidths[2], align: "center" }
      );
      doc.font("Arabic-Bold");

      doc.fillColor(COLORS.muted).font("Arabic").fontSize(9);
      writeNumber(doc, String(index + 1), colX[3], y + 11, {
        width: colWidths[3],
        align: "center",
      });
      doc.font("Arabic");

      y += rowHeight + 4;
    });

    // Footer
    const footerY = doc.page.height - 56;
    doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).stroke(COLORS.border);
    doc.fillColor(COLORS.muted).font("Arabic").fontSize(8);
    writeRtl(
      doc,
      `تم الإنشاء بواسطة: ${data.generatedBy}  |  ${formatArabicDateTime(data.generatedAt)}`,
      margin,
      footerY + 10,
      { width: contentWidth, align: "center" }
    );
    writeRtl(doc, "كنيسة السيدة العذراء - نظام إدارة الأنشطة", margin, footerY + 24, {
      width: contentWidth,
      align: "center",
    });

    doc.end();
  });
}
