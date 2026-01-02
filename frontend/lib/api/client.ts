// API client that calls Next.js route handlers (which proxy to backend)

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("/api") ? endpoint : `/api/proxy/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    throw new ApiError(
      response.status,
      data.message || "حدث خطأ",
      data
    );
  }

  return data.data as T;
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { emailOrPhone: string; password: string }) =>
      fetchApi("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    logout: () =>
      fetchApi("/api/auth/logout", {
        method: "POST",
      }),
  },

  // Users (superadmin only)
  users: {
    list: () => fetchApi("users"),
    get: (id: string) => fetchApi(`users/${id}`),
    create: (data: { name: string; email?: string; phone?: string; password: string; role: "superadmin" | "admin" }) =>
      fetchApi("users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Activities
  activities: {
    list: () => fetchApi("activities"),
    get: (id: string) => fetchApi(`activities/${id}`),
    create: (data: any) =>
      fetchApi("activities", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchApi(`activities/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    updateHead: (id: string, headAdminId: string) =>
      fetchApi(`activities/${id}/head`, {
        method: "PATCH",
        body: JSON.stringify({ headAdminId }),
      }),
    delete: (id: string) =>
      fetchApi(`activities/${id}`, {
        method: "DELETE",
      }),
  },

  // Groups
  groups: {
    list: (activityId: string, label?: string) => {
      const query = label ? `?label=${encodeURIComponent(label)}` : "";
      return fetchApi(`activities/${activityId}/groups${query}`);
    },
    create: (activityId: string, data: any) =>
      fetchApi(`activities/${activityId}/groups`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (groupId: string, data: any) =>
      fetchApi(`groups/${groupId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  // Students
  students: {
    list: (search?: string) => {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      return fetchApi(`students${query}`);
    },
    get: (id: string) => fetchApi(`students/${id}`),
    create: (data: any) =>
      fetchApi("students", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Enrollments
  enrollments: {
    list: (groupId: string) => fetchApi(`groups/${groupId}/students`),
    enroll: (groupId: string, studentId: string) =>
      fetchApi(`groups/${groupId}/students`, {
        method: "POST",
        body: JSON.stringify({ studentId }),
      }),
    remove: (groupId: string, studentId: string) =>
      fetchApi(`groups/${groupId}/students/${studentId}`, {
        method: "DELETE",
      }),
  },

  // Sessions
  sessions: {
    list: (groupId: string) => fetchApi(`groups/${groupId}/sessions`),
    get: (sessionId: string) => fetchApi(`sessions/${sessionId}`),
    create: (groupId: string, data: any) =>
      fetchApi(`groups/${groupId}/sessions`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStudent: (sessionId: string, studentId: string, data: any) =>
      fetchApi(`sessions/${sessionId}/students/${studentId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  // Global grades
  globalGrades: {
    get: (activityId: string, studentId: string) =>
      fetchApi(`activities/${activityId}/students/${studentId}/global-grades`),
    upsert: (activityId: string, studentId: string, data: any) =>
      fetchApi(`activities/${activityId}/students/${studentId}/global-grades`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  // Reports
  reports: {
    studentSummary: (activityId: string, studentId: string) =>
      fetchApi(`reports/activity/${activityId}/student/${studentId}/summary`),
    groupPerformance: (groupId: string) =>
      fetchApi(`reports/group/${groupId}/performance`),
  },

  // Admin management
  admin: {
    listAdmins: (activityId: string) =>
      fetchApi(`activities/${activityId}/admins`),
    addAdmin: (activityId: string, userId: string) =>
      fetchApi(`activities/${activityId}/admins`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      }),
    removeAdmin: (activityId: string, userId: string) =>
      fetchApi(`activities/${activityId}/admins/${userId}`, {
        method: "DELETE",
      }),
    changeHead: (activityId: string, headAdminId: string) =>
      fetchApi(`activities/${activityId}/head`, {
        method: "PATCH",
        body: JSON.stringify({ headAdminId }),
      }),
  },
};

export { ApiError };
export type { ApiResponse };

