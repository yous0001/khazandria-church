import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "auth_token";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);

    return NextResponse.json({
      success: true,
      message: "تم تسجيل الخروج بنجاح",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تسجيل الخروج" },
      { status: 500 }
    );
  }
}

