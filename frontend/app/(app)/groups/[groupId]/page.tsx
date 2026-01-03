"use client";

import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  Users,
  Calendar,
  Trash2,
  ChevronLeft,
  Award,
} from "lucide-react";
import { EnrollStudentDialog } from "@/components/dialogs/enroll-student-dialog";
import { CreateSessionDialog } from "@/components/dialogs/create-session-dialog";
import { EditGlobalGradesDialog } from "@/components/dialogs/edit-global-grades-dialog";
import { toast } from "sonner";
import type {
  GroupStudent,
  Session,
  Group,
  Activity,
  GlobalGrade,
} from "@/types/domain";

export default function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const queryClient = useQueryClient();

  const { data: group } = useQuery<Group>({
    queryKey: ["group", groupId],
    queryFn: () => api.groups.get(groupId),
  });

  const { data: activity } = useQuery<Activity>({
    queryKey: ["activity", group?.activityId],
    queryFn: () => api.activities.get(group!.activityId),
    enabled: !!group?.activityId,
  });

  const { data: students } = useQuery<GroupStudent[]>({
    queryKey: ["group-students", groupId],
    queryFn: () => api.enrollments.list(groupId),
  });

  const { data: sessions } = useQuery<Session[]>({
    queryKey: ["sessions", groupId],
    queryFn: () => api.sessions.list(groupId),
  });

  const removeStudentMutation = useMutation({
    mutationFn: (studentId: string) =>
      api.enrollments.remove(groupId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-students", groupId] });
      toast.success("تم إزالة الطالب من المجموعة");
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء إزالة الطالب");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/activities">
          <Button variant="ghost" size="icon">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold flex-1">المجموعة</h2>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="students" className="gap-2">
            <Users className="h-4 w-4" />
            الطلاب ({students?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Calendar className="h-4 w-4" />
            الجلسات ({sessions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="grades" className="gap-2">
            <Award className="h-4 w-4" />
            الدرجات الإجمالية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <EnrollStudentDialog groupId={groupId} />
          </div>

          {students?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <Users className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground text-center">
                  لا يوجد طلاب في هذه المجموعة
                </p>
                <EnrollStudentDialog groupId={groupId} />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {students?.map((enrollment) => {
                const student =
                  typeof enrollment.studentId === "object"
                    ? enrollment.studentId
                    : null;
                const studentIdValue =
                  typeof enrollment.studentId === "string"
                    ? enrollment.studentId
                    : student?._id || "";
                return (
                  <Card key={enrollment._id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <span className="font-medium">
                          {student?.name || "طالب"}
                        </span>
                        {(student?.phone || student?.email) && (
                          <p className="text-sm text-muted-foreground">
                            {student?.phone || student?.email}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("هل أنت متأكد من إزالة هذا الطالب؟")) {
                            removeStudentMutation.mutate(studentIdValue);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <CreateSessionDialog groupId={groupId} />
          </div>

          {sessions?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <Calendar className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground text-center">
                  لا توجد جلسات مسجلة
                </p>
                <CreateSessionDialog groupId={groupId} />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {sessions?.map((session) => (
                <Link key={session._id} href={`/sessions/${session._id}`}>
                  <Card className="hover:bg-accent transition-colors cursor-pointer">
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">
                          {new Date(session.sessionDate).toLocaleDateString(
                            "ar-EG",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.students.filter((s) => s.present).length}{" "}
                          حاضر من {session.students.length} طالب
                        </p>
                      </div>
                      <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="grades" className="space-y-3 mt-4">
          {!activity?.globalGrades || activity.globalGrades.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <Award className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground text-center">
                  لا توجد درجات إجمالية محددة لهذا النشاط
                </p>
              </CardContent>
            </Card>
          ) : students?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <Users className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground text-center">
                  لا يوجد طلاب في هذه المجموعة
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {students?.map((enrollment) => {
                const student =
                  typeof enrollment.studentId === "object"
                    ? enrollment.studentId
                    : null;
                const studentIdValue =
                  typeof enrollment.studentId === "string"
                    ? enrollment.studentId
                    : student?._id || "";
                const studentName = student?.name || "طالب";

                return (
                  <GlobalGradesCard
                    key={enrollment._id}
                    activityId={group!.activityId}
                    studentId={studentIdValue}
                    studentName={studentName}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component to display global grades for a student
function GlobalGradesCard({
  activityId,
  studentId,
  studentName,
}: {
  activityId: string;
  studentId: string;
  studentName: string;
}) {
  const { data: globalGrade } = useQuery<GlobalGrade>({
    queryKey: ["global-grades", activityId, studentId],
    queryFn: () => api.globalGrades.get(activityId, studentId),
  });

  const { data: activity } = useQuery<Activity>({
    queryKey: ["activity", activityId],
    queryFn: () => api.activities.get(activityId),
  });

  if (!activity?.globalGrades || activity.globalGrades.length === 0) {
    return null;
  }

  // Ensure we have all grade types (should be initialized by backend)
  const allGrades =
    globalGrade?.grades ||
    activity.globalGrades.map((g) => ({
      gradeName: g.name,
      mark: 0,
      fullMark: g.fullMark,
      status: "not_taken" as const,
    }));

  const takenGrades = allGrades.filter((g) => g.status === "taken");
  const totalMark = globalGrade?.totalGlobalMark || 0;
  const totalFullMark = takenGrades.reduce((sum, g) => sum + g.fullMark, 0);
  const sessionMark = globalGrade?.totalSessionMark || 0;
  const finalMark = globalGrade?.totalFinalMark || 0;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">{studentName}</h3>
            <div className="text-sm text-muted-foreground mt-1 space-y-1">
              <div>
                الدرجات الإجمالية (المأداة): {totalMark} / {totalFullMark}
              </div>
              <div>درجات الجلسات: {sessionMark}</div>
              <div className="font-medium text-foreground">
                المجموع النهائي: {finalMark}
              </div>
            </div>
          </div>
          <EditGlobalGradesDialog
            activityId={activityId}
            studentId={studentId}
            studentName={studentName}
            trigger={
              <Button variant="default" size="sm">
                <Award className="h-4 w-4 ml-2" />
                إضافة/تعديل الدرجات
              </Button>
            }
          />
        </div>

        <div className="space-y-2 pt-3 border-t">
          {allGrades.map((grade) => (
            <div
              key={grade.gradeName}
              className="flex items-center justify-between text-sm p-2 rounded border"
            >
              <div className="flex items-center gap-2">
                <span
                  className={
                    grade.status === "taken"
                      ? "font-medium"
                      : "text-muted-foreground"
                  }
                >
                  {grade.gradeName}
                </span>
                {grade.status === "not_taken" && (
                  <span className="text-xs text-muted-foreground">
                    (لم يتم أداء الامتحان)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {grade.status === "taken" ? (
                  <span className="font-medium">
                    {grade.mark} / {grade.fullMark}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    0 / {grade.fullMark}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
