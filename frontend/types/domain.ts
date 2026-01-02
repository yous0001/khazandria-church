// Domain types matching backend models

export type UserRole = "superadmin" | "admin";
export type ActivityRole = "head" | "admin";

export interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface GradeType {
  name: string;
  fullMark: number;
}

export interface Activity {
  _id: string;
  name: string;
  headAdminId: string;
  sessionBonusMax: number;
  sessionGrades: GradeType[];
  globalGrades: GradeType[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityMembership {
  _id: string;
  activityId: string;
  userId: string;
  roleInActivity: ActivityRole;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  _id: string;
  activityId: string;
  name: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupStudent {
  _id: string;
  activityId: string;
  groupId: string;
  studentId: string;
  createdAt: string;
}

export interface SessionGrade {
  gradeName: string;
  mark: number;
  fullMark: number;
}

export interface SessionStudent {
  studentId: string;
  present: boolean;
  sessionMark: number;
  bonusMark: number;
  totalSessionMark: number;
  sessionGrades: SessionGrade[];
  recordedByUserId: string;
}

export interface Session {
  _id: string;
  groupId: string;
  sessionDate: string;
  createdByUserId: string;
  students: SessionStudent[];
  createdAt: string;
  updatedAt: string;
}

export interface GlobalGradeEntry {
  gradeName: string;
  mark: number;
  fullMark: number;
}

export interface GlobalGrade {
  _id: string;
  activityId: string;
  studentId: string;
  grades: GlobalGradeEntry[];
  totalGlobalMark: number;
  totalSessionMark: number;
  totalFinalMark: number;
  recordedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSummary {
  studentId: string;
  studentName: string;
  totalSessions: number;
  sessionsPresent: number;
  sessionsAbsent: number;
  attendanceRate: number;
  totalSessionMark: number;
  totalGlobalMark: number;
  totalFinalMark: number;
}

export interface GroupPerformance {
  studentId: string;
  studentName: string;
  totalSessions: number;
  sessionsPresent: number;
  totalSessionMark: number;
}

