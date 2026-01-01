import { GroupStudent, IGroupStudent } from './groupStudent.model';
import { Group } from '../groups/group.model';
import { Student } from '../students/student.model';
import { HttpError } from '../../utils/httpError';
import { isValidObjectId } from '../../utils/objectId';

export interface EnrollStudentDTO {
  studentId: string;
}

export class GroupStudentService {
  async enrollStudent(groupId: string, studentId: string): Promise<IGroupStudent> {
    if (!isValidObjectId(groupId) || !isValidObjectId(studentId)) {
      throw new HttpError(400, 'Invalid ID');
    }

    // Get group to find activityId
    const group = await Group.findById(groupId);
    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      throw new HttpError(404, 'Student not found');
    }

    // Check if student is already in another group in this activity
    const existingEnrollment = await GroupStudent.findOne({
      activityId: group.activityId,
      studentId,
    });

    if (existingEnrollment) {
      throw new HttpError(409, 'Student is already enrolled in another group in this activity');
    }

    // Create enrollment
    const enrollment = await GroupStudent.create({
      activityId: group.activityId,
      groupId,
      studentId,
    });

    return enrollment;
  }

  async getGroupStudents(groupId: string): Promise<IGroupStudent[]> {
    if (!isValidObjectId(groupId)) {
      throw new HttpError(400, 'Invalid group ID');
    }

    return GroupStudent.find({ groupId })
      .populate('studentId', 'name phone email')
      .sort({ createdAt: 1 });
  }

  async removeStudent(groupId: string, studentId: string): Promise<void> {
    if (!isValidObjectId(groupId) || !isValidObjectId(studentId)) {
      throw new HttpError(400, 'Invalid ID');
    }

    const enrollment = await GroupStudent.findOne({ groupId, studentId });
    if (!enrollment) {
      throw new HttpError(404, 'Student enrollment not found');
    }

    await GroupStudent.deleteOne({ _id: enrollment._id });
  }
}

export const groupStudentService = new GroupStudentService();

