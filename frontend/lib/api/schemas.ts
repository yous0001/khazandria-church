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

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمة المرور الجديدة وتأكيدها غير متطابقين",
  path: ["confirmPassword"],
});

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export const updateUserPasswordSchema = z.object({
  newPassword: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمة المرور الجديدة وتأكيدها غير متطابقين",
  path: ["confirmPassword"],
});

export type UpdateUserPasswordInput = z.infer<typeof updateUserPasswordSchema>;

// Activity schemas
export const gradeTypeSchema = z.object({
  name: z.string().min(1, "اسم الدرجة مطلوب"),
  fullMark: z.number().min(0, "الدرجة الكاملة يجب أن تكون رقم موجب"),
});

export const createActivitySchema = z.object({
  name: z.string().min(1, "اسم النشاط مطلوب"),
  headAdminId: z.string().min(1, "مسؤول النشاط مطلوب"),
  sessionBonusMax: z.number().min(0).max(5).default(5),
  allowMultipleGroups: z.boolean().default(false),
  globalGrades: z.array(gradeTypeSchema).default([]),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;

export const updateActivitySchema = z.object({
  name: z.string().min(1, "اسم النشاط مطلوب").optional(),
  sessionBonusMax: z.number().min(0).max(5).optional(),
  allowMultipleGroups: z.boolean().optional(),
});

export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

export const updateGroupSchema = z.object({
  name: z.string().min(1, "اسم المجموعة مطلوب").optional(),
  labels: z.array(z.string()).optional(),
});

export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

export const enrollStudentsBulkSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1, "اختر طالباً واحداً على الأقل"),
});

export type EnrollStudentsBulkInput = z.infer<typeof enrollStudentsBulkSchema>;

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

export const updateSessionStudentSchema = z.object({
  present: z.boolean(),
  bonusMark: z.number().min(0).max(5).default(0),
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

