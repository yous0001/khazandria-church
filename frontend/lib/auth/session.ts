import { cookies } from "next/headers";

const COOKIE_NAME = "auth_token";

export interface SessionUser {
  userId: string;
  role: "superadmin" | "admin";
  name: string;
  email?: string;
}

export async function getSession(): Promise<{ token: string | null; user: SessionUser | null }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value || null;
  
  if (!token) {
    return { token: null, user: null };
  }

  // TODO: Optionally decode JWT to get user info
  // For now, we'll fetch user info from backend when needed
  return { token, user: null };
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.then((store) => {
    store.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
  });
}


