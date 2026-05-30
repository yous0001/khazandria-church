export interface StudentEnrollmentContext {
  groupId: string;
  createdAt: Date;
}

export interface EnrollmentHistoryRecord {
  groupId: string;
  startedAt: Date;
  endedAt: Date | null;
}

export interface GroupMembershipPeriod {
  groupId: string;
  from: Date;
  to: Date;
}

const FAR_FUTURE = new Date(8640000000000000);

/**
 * Membership windows from enrollment history + current enrollment only.
 * GroupEnrollmentHistory is the source of truth for transfers and removals.
 */
export function buildGroupMembershipPeriods(
  enrollmentHistory: EnrollmentHistoryRecord[],
  currentEnrollment: StudentEnrollmentContext | null
): GroupMembershipPeriod[] {
  const periodMap = new Map<string, { from: Date; to: Date }>();

  const mergePeriod = (groupId: string, from: Date, to: Date) => {
    const existing = periodMap.get(groupId);
    if (!existing) {
      periodMap.set(groupId, { from, to });
      return;
    }
    if (from < existing.from) existing.from = from;
    if (to > existing.to) existing.to = to;
  };

  for (const record of enrollmentHistory) {
    mergePeriod(
      record.groupId,
      record.startedAt,
      record.endedAt ?? FAR_FUTURE
    );
  }

  if (currentEnrollment) {
    mergePeriod(
      currentEnrollment.groupId,
      currentEnrollment.createdAt,
      FAR_FUTURE
    );
  }

  return Array.from(periodMap.entries()).map(([groupId, range]) => ({
    groupId,
    from: range.from,
    to: range.to,
  }));
}

/** Whether a student belonged to a group when a session took place. */
export function wasMemberAt(
  groupId: string,
  sessionDate: Date,
  enrollmentHistory: EnrollmentHistoryRecord[],
  currentEnrollment: StudentEnrollmentContext | null
): boolean {
  const periods = buildGroupMembershipPeriods(
    enrollmentHistory,
    currentEnrollment
  );

  return periods.some(
    (period) =>
      period.groupId === groupId &&
      sessionDate >= period.from &&
      sessionDate <= period.to
  );
}
