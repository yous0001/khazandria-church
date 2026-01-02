import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.INTERNAL_API_BASE_URL || "http://localhost:5000/api";
const COOKIE_NAME = "auth_token";

async function proxyRequest(
  request: NextRequest,
  method: string,
  path: string[]
) {
  try {
    // Get auth token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "غير مصرح" },
        { status: 401 }
      );
    }

    // Build backend URL
    const backendPath = path.join("/");
    const url = new URL(`${BACKEND_URL}/${backendPath}`);
    
    // Copy query parameters
    const searchParams = request.nextUrl.searchParams;
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    // Prepare request options
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    };

    // Add body for POST, PUT, PATCH
    if (["POST", "PUT", "PATCH"].includes(method)) {
      try {
        const body = await request.json();
        options.body = JSON.stringify(body);
      } catch {
        // No body or invalid JSON
      }
    }

    // Forward request to backend
    const response = await fetch(url.toString(), options);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ في الاتصال بالخادم" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, "GET", params.path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, "POST", params.path);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, "PUT", params.path);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, "PATCH", params.path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, "DELETE", params.path);
}

