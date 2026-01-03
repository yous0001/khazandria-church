// API client that calls Next.js route handlers (which proxy to backend)

import type { Activity, Group, User, Student, Session, GlobalGrade, StudentSummary, GroupPerformance, GroupStudent, ActivityMembership } from "@/types/domain";

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
    getCurrent: () => fetchApi<User>("users/me"),
    list: () => fetchApi<User[]>("users"),
    get: (id: string) => fetchApi<User>(`users/${id}`),
    create: (data: { name: string; email?: string; phone?: string; password: string; role: "superadmin" | "admin" }) =>
      fetchApi<User>("users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updatePassword: (userId: string, newPassword: string) =>
      fetchApi<void>(`users/${userId}/password`, {
        method: "PATCH",
        body: JSON.stringify({ newPassword }),
      }),
    delete: (userId: string) =>
      fetchApi<void>(`users/${userId}`, {
        method: "DELETE",
      }),
    updateOwnPassword: (currentPassword: string, newPassword: string) =>
      fetchApi<void>("users/me/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    getActivityMemberships: (userId: string) =>
      fetchApi<ActivityMembership[]>(`users/${userId}/activities`),
    addActivityPermission: (userId: string, activityId: string, roleInActivity?: "head" | "admin") =>
      fetchApi<ActivityMembership>(`users/${userId}/activities`, {
        method: "POST",
        body: JSON.stringify({ activityId, roleInActivity: roleInActivity || "admin" }),
      }),
    removeActivityPermission: (userId: string, activityId: string) =>
      fetchApi<void>(`users/${userId}/activities/${activityId}`, {
        method: "DELETE",
      }),
  },

  // Activities
  activities: {
    list: () => fetchApi<Activity[]>("activities"),
    get: (id: string) => fetchApi<Activity>(`activities/${id}`),
    create: (data: any) =>
      fetchApi<Activity>("activities", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchApi<Activity>(`activities/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    updateHead: (id: string, headAdminId: string) =>
      fetchApi<Activity>(`activities/${id}/head`, {
        method: "PATCH",
        body: JSON.stringify({ headAdminId }),
      }),
    delete: (id: string) =>
      fetchApi<void>(`activities/${id}`, {
        method: "DELETE",
      }),
  },

  // Groups
  groups: {
    list: (activityId: string, label?: string) => {
      const query = label ? `?label=${encodeURIComponent(label)}` : "";
      return fetchApi<Group[]>(`activities/${activityId}/groups${query}`);
    },
    get: (groupId: string) => fetchApi<Group>(`groups/${groupId}`),
    create: (activityId: string, data: any) =>
      fetchApi<Group>(`activities/${activityId}/groups`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (groupId: string, data: any) =>
      fetchApi<Group>(`groups/${groupId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  // Students
  students: {
    list: (search?: string) => {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      return fetchApi<Student[]>(`students${query}`);
    },
    get: (id: string) => fetchApi<Student>(`students/${id}`),
    create: (data: any) =>
      fetchApi<Student>("students", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Enrollments
  enrollments: {
    list: (groupId: string) => fetchApi<GroupStudent[]>(`groups/${groupId}/students`),
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
    list: (groupId: string) => fetchApi<Session[]>(`groups/${groupId}/sessions`),
    get: (sessionId: string) => fetchApi<Session>(`sessions/${sessionId}`),
    create: (groupId: string, data: any) =>
      fetchApi<Session>(`groups/${groupId}/sessions`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStudent: (sessionId: string, studentId: string, data: any) =>
      fetchApi<Session>(`sessions/${sessionId}/students/${studentId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (sessionId: string) =>
      fetchApi<void>(`sessions/${sessionId}`, {
        method: "DELETE",
      }),
  },

  // Global grades
  globalGrades: {
    get: (activityId: string, studentId: string) =>
      fetchApi<GlobalGrade>(`activities/${activityId}/students/${studentId}/global-grades`),
    upsert: (activityId: string, studentId: string, data: any) =>
      fetchApi<GlobalGrade>(`activities/${activityId}/students/${studentId}/global-grades`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  // Reports
  reports: {
    studentSummary: (activityId: string, studentId: string) =>
      fetchApi<StudentSummary>(`reports/activity/${activityId}/student/${studentId}/summary`),
    groupPerformance: (groupId: string) =>
      fetchApi<GroupPerformance[]>(`reports/group/${groupId}/performance`),
  },

  // Admin management
  admin: {
    listAdmins: (activityId: string) =>
      fetchApi<ActivityMembership[]>(`activities/${activityId}/admins`),
    addAdmin: (activityId: string, userId: string) =>
      fetchApi<ActivityMembership>(`activities/${activityId}/admins`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      }),
    removeAdmin: (activityId: string, userId: string) =>
      fetchApi<void>(`activities/${activityId}/admins/${userId}`, {
        method: "DELETE",
      }),
    changeHead: (activityId: string, headAdminId: string) =>
      fetchApi<Activity>(`activities/${activityId}/head`, {
        method: "PATCH",
        body: JSON.stringify({ headAdminId }),
      }),
  },
};

export { ApiError };
export type { ApiResponse };

