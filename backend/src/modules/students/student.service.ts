import { Student, IStudent } from './student.model';
import { GroupStudent } from '../enrollments/groupStudent.model';
import { Session } from '../sessions/session.model';
import { GlobalGrade } from '../globalGrades/globalGrade.model';
import { HttpError } from '../../utils/httpError';
import { isValidObjectId } from '../../utils/objectId';

export interface CreateStudentDTO {
  name: string;
  phone?: string;
  email?: string;
}

export interface UpdateStudentDTO {
  name?: string;
  phone?: string;
  email?: string;
}

export class StudentService {
  async createStudent(dto: CreateStudentDTO): Promise<IStudent> {
    const student = await Student.create(dto);
    return student;
  }

  async getAllStudents(searchTerm?: string): Promise<IStudent[]> {
    const query: any = {};

    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    return Student.find(query).sort({ name: 1 }).limit(100);
  }

  async getStudentById(studentId: string): Promise<IStudent> {
    if (!isValidObjectId(studentId)) {
      throw new HttpError(400, 'Invalid student ID');
    }

    const student = await Student.findById(studentId);
    if (!student) {
      throw new HttpError(404, 'Student not found');
    }

    return student;
  }

  async updateStudent(studentId: string, dto: UpdateStudentDTO): Promise<IStudent> {
    if (!isValidObjectId(studentId)) {
      throw new HttpError(400, 'Invalid student ID');
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      { $set: dto },
      { new: true, runValidators: true }
    );

    if (!student) {
      throw new HttpError(404, 'Student not found');
    }

    return student;
  }

  async deleteStudent(studentId: string): Promise<void> {
    if (!isValidObjectId(studentId)) {
      throw new HttpError(400, 'Invalid student ID');
    }

    const student = await Student.findById(studentId);
    if (!student) {
      throw new HttpError(404, 'Student not found');
    }

    // Check if student has any enrollments
    const enrollments = await GroupStudent.find({ studentId });
    if (enrollments.length > 0) {
      throw new HttpError(
        400,
        'Cannot delete student: Student is enrolled in groups. Please remove student from all groups first.'
      );
    }

    // Check if student has any session records
    const sessionsWithStudent = await Session.find({
      'students.studentId': studentId,
    });
    if (sessionsWithStudent.length > 0) {
      throw new HttpError(
        400,
        'Cannot delete student: Student has session records. Student deletion is not allowed when session data exists.'
      );
    }

    // Check if student has global grades
    const globalGrades = await GlobalGrade.find({ studentId });
    if (globalGrades.length > 0) {
      // Delete global grades
      await GlobalGrade.deleteMany({ studentId });
    }

    // Delete the student
    await Student.deleteOne({ _id: studentId });
  }
}

export const studentService = new StudentService();





