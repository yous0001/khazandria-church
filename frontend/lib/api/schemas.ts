import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "البريد الإلكتروني أو الهاتف مطلوب"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// User schemas
export const createUserSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  phone: z.string().optional(),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  role: z.enum(["superadmin", "admin"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// Activity schemas
export const gradeTypeSchema = z.object({
  name: z.string().min(1, "اسم الدرجة مطلوب"),
  fullMark: z.number().min(0, "الدرجة الكاملة يجب أن تكون رقم موجب"),
});

export const createActivitySchema = z.object({
  name: z.string().min(1, "اسم النشاط مطلوب"),
  headAdminId: z.string().min(1, "مسؤول النشاط مطلوب"),
  sessionBonusMax: z.number().min(0).default(5),
  sessionGrades: z.array(gradeTypeSchema).default([]),
  globalGrades: z.array(gradeTypeSchema).default([]),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;

// Group schemas
export const createGroupSchema = z.object({
  activityId: z.string().min(1),
  name: z.string().min(1, "اسم المجموعة مطلوب"),
  labels: z.array(z.string()).default([]),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

// Student schemas
export const createStudentSchema = z.object({
  name: z.string().min(1, "اسم الطالب مطلوب"),
  phone: z.string().optional(),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

// Enrollment schema
export const enrollStudentSchema = z.object({
  studentId: z.string().min(1, "الطالب مطلوب"),
});

export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;

// Session schemas
export const createSessionSchema = z.object({
  sessionDate: z.date(),
  initializeStudents: z.boolean().default(true),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const sessionGradeSchema = z.object({
  gradeName: z.string(),
  mark: z.number().min(0),
  fullMark: z.number().min(0),
});

export const updateSessionStudentSchema = z.object({
  present: z.boolean(),
  bonusMark: z.number().min(0).default(0),
  sessionGrades: z.array(sessionGradeSchema).default([]),
});

export type UpdateSessionStudentInput = z.infer<typeof updateSessionStudentSchema>;

// Global grades schema
export const globalGradeEntrySchema = z.object({
  gradeName: z.string(),
  mark: z.number().min(0),
  fullMark: z.number().min(0),
});

export const upsertGlobalGradeSchema = z.object({
  grades: z.array(globalGradeEntrySchema),
});

export type UpsertGlobalGradeInput = z.infer<typeof upsertGlobalGradeSchema>;

