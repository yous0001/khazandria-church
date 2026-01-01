import { Student, IStudent } from './student.model';
import { HttpError } from '../../utils/httpError';
import { isValidObjectId } from '../../utils/objectId';

export interface CreateStudentDTO {
  name: string;
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
}

export const studentService = new StudentService();

