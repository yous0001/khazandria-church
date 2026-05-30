import { connectDB } from "../config/db";
import { Activity } from "../modules/activities/activity.model";
import { GlobalGrade } from "../modules/globalGrades/globalGrade.model";
import { globalGradeService } from "../modules/globalGrades/globalGrade.service";

/**
 * Legacy migration: bonus-only grades + refresh totals from SessionAttendance.
 * Safe on a fresh database (no embedded session.students).
 */
const migrate = async () => {
  try {
    console.log("Starting bonus-only grade refresh migration...");
    await connectDB();

    const activityResult = await Activity.updateMany(
      {},
      {
        $unset: { sessionGrades: "" },
        $set: { sessionBonusMax: 5 },
      }
    );
    console.log(`Updated ${activityResult.modifiedCount} activities`);

    const globalGrades = await GlobalGrade.find({});
    let refreshedGrades = 0;

    for (const grade of globalGrades) {
      const totalSessionMark =
        await globalGradeService.calculateStudentSessionTotal(
          grade.activityId.toString(),
          grade.studentId.toString()
        );

      if (
        grade.totalSessionMark !== totalSessionMark ||
        grade.totalFinalMark !== grade.totalGlobalMark + totalSessionMark
      ) {
        grade.totalSessionMark = totalSessionMark;
        grade.totalFinalMark = grade.totalGlobalMark + totalSessionMark;
        await grade.save();
        refreshedGrades++;
      }
    }

    console.log(`Refreshed ${refreshedGrades} global grade records`);
    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
};

migrate();
