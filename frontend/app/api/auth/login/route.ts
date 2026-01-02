import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.INTERNAL_API_BASE_URL || "http://localhost:5000/api";
const COOKIE_NAME = "auth_token";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailOrPhone, password } = body;

    if (!emailOrPhone || !password) {
      return NextResponse.json(
        { success: false, message: "البريد الإلكتروني/الهاتف وكلمة المرور مطلوبان" },
        { status: 400 }
      );
    }

    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ emailOrPhone, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || "فشل تسجيل الدخول" 
        },
        { status: response.status }
      );
    }

    // Set httpOnly cookie with the token
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, data.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    // Return user data without the token
    return NextResponse.json({
      success: true,
      data: {
        user: data.data.user,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تسجيل الدخول" },
      { status: 500 }
    );
  }
}

