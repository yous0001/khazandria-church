import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.INTERNAL_API_BASE_URL || "http://localhost:5000/api";
const COOKIE_NAME = "auth_token";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "غير مصرح" },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/sessions/${sessionId}/attendance-pdf/download`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "فشل تحميل التقرير",
      }));
      return NextResponse.json(error, { status: response.status });
    }

    const pdfBuffer = await response.arrayBuffer();
    const contentDisposition =
      response.headers.get("Content-Disposition") ||
      'inline; filename="attendance-report.pdf"';

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("Attendance PDF proxy error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تحميل التقرير" },
      { status: 500 }
    );
  }
}
