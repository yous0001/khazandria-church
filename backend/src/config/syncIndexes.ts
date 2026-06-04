import { GroupStudent } from '../modules/enrollments/groupStudent.model';

export async function syncEnrollmentIndexes(): Promise<void> {
  try {
    const collection = GroupStudent.collection;
    const indexes = await collection.indexes();

    for (const index of indexes) {
      const keys = index.key as Record<string, number> | undefined;
      if (
        index.unique &&
        keys?.activityId === 1 &&
        keys?.studentId === 1 &&
        !keys?.groupId &&
        index.name
      ) {
        await collection.dropIndex(index.name);
        console.log(`Dropped legacy index: ${index.name}`);
      }
    }

    await GroupStudent.syncIndexes();
    console.log('GroupStudent indexes synced');
  } catch (error) {
    console.error('Failed to sync GroupStudent indexes:', error);
  }
}
