import { IActivity } from "../modules/activities/activity.model";
import { IGlobalGradeEntry } from "../modules/globalGrades/globalGrade.model";

export interface SessionStudentInput {
  present: boolean;
  bonusMark?: number;
}

export interface CalculatedSessionStudent {
  bonusMark: number;
  totalSessionMark: number;
}

/**
 * Calculate session marks: attendance has no points; only bonus counts when present.
 * totalSessionMark = bonusMark (0 if absent), clamped to activity.sessionBonusMax (max 5).
 */
export const calculateSessionMarks = (
  activity: IActivity,
  input: SessionStudentInput
): CalculatedSessionStudent => {
  const { present, bonusMark: requestedBonus = 0 } = input;
  const bonusMax = Math.min(activity.sessionBonusMax ?? 5, 5);

  if (!present) {
    return { bonusMark: 0, totalSessionMark: 0 };
  }

  const bonusMark = Math.max(0, Math.min(requestedBonus, bonusMax));
  return { bonusMark, totalSessionMark: bonusMark };
};

/**
 * Calculate total global mark from grade entries (taken grades only).
 */
export const calculateGlobalTotal = (grades: IGlobalGradeEntry[]): number => {
  return grades.reduce((sum, grade) => sum + grade.mark, 0);
};

/**
 * Calculate total session mark for a student across session entries.
 */
export const calculateTotalSessionMark = (
  entries: Array<{ totalSessionMark: number }>
): number => {
  return entries.reduce((sum, entry) => sum + entry.totalSessionMark, 0);
};

/**
 * Validate global grades against activity configuration.
 */
export const validateGlobalGrades = (
  activity: IActivity,
  globalGrades: IGlobalGradeEntry[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  for (const grade of globalGrades) {
    const configGrade = activity.globalGrades.find(
      (g) => g.name === grade.gradeName
    );

    if (!configGrade) {
      errors.push(
        `Grade "${grade.gradeName}" is not configured for this activity`
      );
      continue;
    }

    if (grade.mark > grade.fullMark) {
      errors.push(
        `Mark ${grade.mark} exceeds full mark ${grade.fullMark} for "${grade.gradeName}"`
      );
    }

    if (grade.mark < 0) {
      errors.push(`Mark cannot be negative for "${grade.gradeName}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
