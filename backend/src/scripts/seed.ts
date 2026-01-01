import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { env } from '../config/env';
import { User } from '../modules/users/user.model';
import { Activity } from '../modules/activities/activity.model';
import { ActivityMembership } from '../modules/activityMemberships/activityMembership.model';
import { Group } from '../modules/groups/group.model';
import { Student } from '../modules/students/student.model';
import { GroupStudent } from '../modules/enrollments/groupStudent.model';
import { Session } from '../modules/sessions/session.model';
import { GlobalGrade } from '../modules/globalGrades/globalGrade.model';
import { authService } from '../modules/auth/auth.service';

const seed = async () => {
  try {
    console.log('Starting seed...');

    // Connect to database
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Activity.deleteMany({});
    await ActivityMembership.deleteMany({});
    await Group.deleteMany({});
    await Student.deleteMany({});
    await GroupStudent.deleteMany({});
    await Session.deleteMany({});
    await GlobalGrade.deleteMany({});

    // 1. Create superadmin
    console.log('Creating superadmin...');
    const passwordHash = await authService.hashPassword(env.seedSuperAdminPassword);
    const superadmin = await User.create({
      name: 'Super Admin',
      email: env.seedSuperAdminEmail,
      passwordHash,
      role: 'superadmin',
    });
    console.log(`✓ Superadmin created: ${superadmin.email}`);

    // 2. Create a head admin
    console.log('Creating head admin...');
    const headAdminPasswordHash = await authService.hashPassword('HeadAdmin@123');
    const headAdmin = await User.create({
      name: 'مدير مدارس الأحد',
      email: 'head@khazandria.com',
      phone: '01234567890',
      passwordHash: headAdminPasswordHash,
      role: 'admin',
    });
    console.log(`✓ Head admin created: ${headAdmin.email}`);

    // 3. Create a regular admin
    console.log('Creating regular admin...');
    const adminPasswordHash = await authService.hashPassword('Admin@123');
    const regularAdmin = await User.create({
      name: 'أستاذ يوسف',
      email: 'admin@khazandria.com',
      phone: '01234567891',
      passwordHash: adminPasswordHash,
      role: 'admin',
    });
    console.log(`✓ Regular admin created: ${regularAdmin.email}`);

    // 4. Create activity
    console.log('Creating activity...');
    const activity = await Activity.create({
      name: 'مدارس الأحد',
      headAdminId: headAdmin._id,
      sessionFullMark: 10,
      sessionBonusMax: 5,
      sessionGrades: [
        { name: 'الحضور', fullMark: 10 },
        { name: 'المشاركة', fullMark: 5 },
      ],
      globalGrades: [
        { name: 'الامتحان النهائي', fullMark: 100 },
        { name: 'المشروع', fullMark: 50 },
      ],
    });
    console.log(`✓ Activity created: ${activity.name}`);

    // 5. Create activity memberships
    console.log('Creating activity memberships...');
    await ActivityMembership.create({
      activityId: activity._id,
      userId: headAdmin._id,
      roleInActivity: 'head',
    });
    await ActivityMembership.create({
      activityId: activity._id,
      userId: regularAdmin._id,
      roleInActivity: 'admin',
    });
    console.log('✓ Memberships created');

    // 6. Create groups
    console.log('Creating groups...');
    const group1 = await Group.create({
      activityId: activity._id,
      name: 'المرحلة الابتدائية - بنين',
      labels: ['ابتدائي', 'بنين', 'مرحلة1'],
    });
    const group2 = await Group.create({
      activityId: activity._id,
      name: 'المرحلة الابتدائية - بنات',
      labels: ['ابتدائي', 'بنات', 'مرحلة1'],
    });
    console.log(`✓ Groups created: ${group1.name}, ${group2.name}`);

    // 7. Create students
    console.log('Creating students...');
    const students = await Student.create([
      { name: 'مينا جورج', phone: '01111111111' },
      { name: 'مارك مجدي', phone: '01111111112' },
      { name: 'كيرلس عادل', phone: '01111111113' },
      { name: 'مريم صموئيل', phone: '01111111114' },
      { name: 'مارينا بيتر', phone: '01111111115' },
      { name: 'سارة مجدي', phone: '01111111116' },
    ]);
    console.log(`✓ ${students.length} students created`);

    // 8. Create enrollments
    console.log('Creating enrollments...');
    await GroupStudent.create([
      {
        activityId: activity._id,
        groupId: group1._id,
        studentId: students[0]._id,
      },
      {
        activityId: activity._id,
        groupId: group1._id,
        studentId: students[1]._id,
      },
      {
        activityId: activity._id,
        groupId: group1._id,
        studentId: students[2]._id,
      },
      {
        activityId: activity._id,
        groupId: group2._id,
        studentId: students[3]._id,
      },
      {
        activityId: activity._id,
        groupId: group2._id,
        studentId: students[4]._id,
      },
      {
        activityId: activity._id,
        groupId: group2._id,
        studentId: students[5]._id,
      },
    ]);
    console.log('✓ Enrollments created');

    // 9. Create sessions with attendance
    console.log('Creating sessions...');

    // Session 1 for group 1
    const session1 = await Session.create({
      groupId: group1._id,
      sessionDate: new Date('2025-01-05'),
      createdByUserId: headAdmin._id,
      students: [
        {
          studentId: students[0]._id,
          present: true,
          sessionMark: 10,
          bonusMark: 3,
          totalSessionMark: 13,
          sessionGrades: [
            { gradeName: 'الحضور', mark: 10, fullMark: 10 },
            { gradeName: 'المشاركة', mark: 4, fullMark: 5 },
          ],
          recordedByUserId: headAdmin._id,
        },
        {
          studentId: students[1]._id,
          present: true,
          sessionMark: 10,
          bonusMark: 5,
          totalSessionMark: 15,
          sessionGrades: [
            { gradeName: 'الحضور', mark: 10, fullMark: 10 },
            { gradeName: 'المشاركة', mark: 5, fullMark: 5 },
          ],
          recordedByUserId: headAdmin._id,
        },
        {
          studentId: students[2]._id,
          present: false,
          sessionMark: 0,
          bonusMark: 0,
          totalSessionMark: 0,
          sessionGrades: [],
          recordedByUserId: headAdmin._id,
        },
      ],
    });

    // Session 2 for group 1
    const session2 = await Session.create({
      groupId: group1._id,
      sessionDate: new Date('2025-01-12'),
      createdByUserId: regularAdmin._id,
      students: [
        {
          studentId: students[0]._id,
          present: true,
          sessionMark: 10,
          bonusMark: 4,
          totalSessionMark: 14,
          sessionGrades: [],
          recordedByUserId: regularAdmin._id,
        },
        {
          studentId: students[1]._id,
          present: true,
          sessionMark: 10,
          bonusMark: 2,
          totalSessionMark: 12,
          sessionGrades: [],
          recordedByUserId: regularAdmin._id,
        },
        {
          studentId: students[2]._id,
          present: true,
          sessionMark: 10,
          bonusMark: 1,
          totalSessionMark: 11,
          sessionGrades: [],
          recordedByUserId: regularAdmin._id,
        },
      ],
    });

    // Session 1 for group 2
    const session3 = await Session.create({
      groupId: group2._id,
      sessionDate: new Date('2025-01-06'),
      createdByUserId: headAdmin._id,
      students: [
        {
          studentId: students[3]._id,
          present: true,
          sessionMark: 10,
          bonusMark: 5,
          totalSessionMark: 15,
          sessionGrades: [],
          recordedByUserId: headAdmin._id,
        },
        {
          studentId: students[4]._id,
          present: true,
          sessionMark: 10,
          bonusMark: 3,
          totalSessionMark: 13,
          sessionGrades: [],
          recordedByUserId: headAdmin._id,
        },
        {
          studentId: students[5]._id,
          present: true,
          sessionMark: 10,
          bonusMark: 4,
          totalSessionMark: 14,
          sessionGrades: [],
          recordedByUserId: headAdmin._id,
        },
      ],
    });

    console.log('✓ Sessions created');

    // 10. Create global grades
    console.log('Creating global grades...');
    await GlobalGrade.create({
      activityId: activity._id,
      studentId: students[0]._id,
      grades: [
        { gradeName: 'الامتحان النهائي', mark: 85, fullMark: 100 },
        { gradeName: 'المشروع', mark: 45, fullMark: 50 },
      ],
      totalGlobalMark: 130,
      totalSessionMark: 27, // 13 + 14
      totalFinalMark: 157,
      recordedByUserId: headAdmin._id,
    });

    await GlobalGrade.create({
      activityId: activity._id,
      studentId: students[1]._id,
      grades: [
        { gradeName: 'الامتحان النهائي', mark: 92, fullMark: 100 },
        { gradeName: 'المشروع', mark: 48, fullMark: 50 },
      ],
      totalGlobalMark: 140,
      totalSessionMark: 27, // 15 + 12
      totalFinalMark: 167,
      recordedByUserId: headAdmin._id,
    });

    console.log('✓ Global grades created');

    console.log('\n✅ Seed completed successfully!\n');
    console.log('=== Login Credentials ===');
    console.log(`Superadmin: ${env.seedSuperAdminEmail} / ${env.seedSuperAdminPassword}`);
    console.log(`Head Admin: head@khazandria.com / HeadAdmin@123`);
    console.log(`Regular Admin: admin@khazandria.com / Admin@123`);
    console.log('========================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();

