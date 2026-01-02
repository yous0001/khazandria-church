import { IActivity } from "../modules/activities/activity.model";
import {
  ISessionStudent,
  ISessionGrade,
} from "../modules/sessions/session.model";
import { IGlobalGradeEntry } from "../modules/globalGrades/globalGrade.model";

export interface SessionStudentInput {
  present: boolean;
  bonusMark?: number;
  sessionGrades?: ISessionGrade[];
}

export interface CalculatedSessionStudent {
  sessionMark: number;
  bonusMark: number;
  totalSessionMark: number;
}

/**
 * Calculate session marks for a student based on presence and session grades
 * sessionMark = sum of all sessionGrades marks (if present), else 0
 * totalSessionMark = sessionMark + bonusMark
 */
export const calculateSessionMarks = (
  activity: IActivity,
  input: SessionStudentInput
): CalculatedSessionStudent => {
  const { present, bonusMark: requestedBonus = 0, sessionGrades = [] } = input;

  let sessionMark = 0;
  let bonusMark = 0;

  if (present && sessionGrades.length > 0) {
    // Calculate sessionMark by summing all sessionGrades marks
    sessionMark = sessionGrades.reduce((sum, grade) => sum + grade.mark, 0);
    // Ensure non-negative
    sessionMark = Math.max(0, sessionMark);
    
    // Bonus mark (clamped to max)
    bonusMark = Math.min(requestedBonus, activity.sessionBonusMax);
    bonusMark = Math.max(0, bonusMark);
  } else {
    // If not present, all marks are 0
    sessionMark = 0;
    bonusMark = 0;
  }

  const totalSessionMark = sessionMark + bonusMark;

  return {
    sessionMark,
    bonusMark,
    totalSessionMark,
  };
};

/**
 * Calculate total global mark from grade entries
 */
export const calculateGlobalTotal = (grades: IGlobalGradeEntry[]): number => {
  return grades.reduce((sum, grade) => sum + grade.mark, 0);
};

/**
 * Calculate total session mark for a student across all sessions
 */
export const calculateTotalSessionMark = (
  sessions: ISessionStudent[]
): number => {
  return sessions.reduce((sum, student) => sum + student.totalSessionMark, 0);
};

/**
 * Validate session grades against activity configuration
 */
export const validateSessionGrades = (
  activity: IActivity,
  sessionGrades: ISessionGrade[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  for (const grade of sessionGrades) {
    // Check if grade name exists in activity config
    const configGrade = activity.sessionGrades.find(
      (g) => g.name === grade.gradeName
    );

    if (!configGrade) {
      errors.push(
        `Grade "${grade.gradeName}" is not configured for this activity`
      );
      continue;
    }

    // Check if mark exceeds full mark
    if (grade.mark > grade.fullMark) {
      errors.push(
        `Mark ${grade.mark} exceeds full mark ${grade.fullMark} for "${grade.gradeName}"`
      );
    }

    // Check if mark is negative
    if (grade.mark < 0) {
      errors.push(`Mark cannot be negative for "${grade.gradeName}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate global grades against activity configuration
 */
export const validateGlobalGrades = (
  activity: IActivity,
  globalGrades: IGlobalGradeEntry[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  for (const grade of globalGrades) {
    // Check if grade name exists in activity config
    const configGrade = activity.globalGrades.find(
      (g) => g.name === grade.gradeName
    );

    if (!configGrade) {
      errors.push(
        `Grade "${grade.gradeName}" is not configured for this activity`
      );
      continue;
    }

    // Check if mark exceeds full mark
    if (grade.mark > grade.fullMark) {
      errors.push(
        `Mark ${grade.mark} exceeds full mark ${grade.fullMark} for "${grade.gradeName}"`
      );
    }

    // Check if mark is negative
    if (grade.mark < 0) {
      errors.push(`Mark cannot be negative for "${grade.gradeName}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
