"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, XCircle, Save } from "lucide-react";
import { toast } from "sonner";
import type { Session, SessionGrade } from "@/types/domain";

interface StudentFormData {
  present: boolean;
  bonusMark: number;
  sessionGrades: SessionGrade[];
}

export default function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Local state for form data per student
  const [formData, setFormData] = useState<Record<string, StudentFormData>>({});

  const { data: session, isLoading } = useQuery<Session>({
    queryKey: ["session", sessionId],
    queryFn: () => api.sessions.get(sessionId),
  });

  // Initialize form data when session loads
  useEffect(() => {
    if (session) {
      const initialData: Record<string, StudentFormData> = {};
      session.students.forEach((student: any) => {
        const studentId = student.studentId?._id || student.studentId;
        initialData[studentId] = {
          present: student.present,
          bonusMark: student.bonusMark || 0,
          sessionGrades: student.sessionGrades || [],
        };
      });
      setFormData(initialData);
    }
  }, [session]);

  const updateMutation = useMutation({
    mutationFn: ({
      studentId,
      data,
    }: {
      studentId: string;
      data: any;
    }) => api.sessions.updateStudent(sessionId, studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      toast.success("تم حفظ البيانات بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء الحفظ");
    },
  });

  const updateStudentData = (studentId: string, updates: Partial<StudentFormData>) => {
    setFormData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        ...updates,
      },
    }));
  };

  const updateSessionGrade = (studentId: string, gradeIndex: number, mark: number) => {
    setFormData((prev) => {
      const studentData = prev[studentId];
      if (!studentData) return prev;
      
      const newGrades = [...studentData.sessionGrades];
      newGrades[gradeIndex] = {
        ...newGrades[gradeIndex],
        mark: Math.min(mark, newGrades[gradeIndex].fullMark),
      };
      
      return {
        ...prev,
        [studentId]: {
          ...studentData,
          sessionGrades: newGrades,
        },
      };
    });
  };

  const saveStudent = (studentId: string) => {
    const data = formData[studentId];
    if (data) {
      updateMutation.mutate({
        studentId,
        data,
      });
    }
  };

  const togglePresence = (studentId: string) => {
    const data = formData[studentId];
    if (!data) return;
    
    const newPresent = !data.present;
    updateStudentData(studentId, { present: newPresent });
    
    // Auto-save when toggling presence
    updateMutation.mutate({
      studentId,
      data: {
        ...data,
        present: newPresent,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">الجلسة غير موجودة</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          العودة
        </Button>
      </div>
    );
  }

  const presentCount = Object.values(formData).filter((d) => d.present).length;
  const absentCount = session.students.length - presentCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">تسجيل الحضور والدرجات</h2>
          <p className="text-sm text-muted-foreground">
            {new Date(session.sessionDate).toLocaleDateString("ar-EG", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <Badge variant="default" className="gap-1 py-1.5 px-3">
          <CheckCircle className="h-3.5 w-3.5" />
          حاضر: {presentCount}
        </Badge>
        <Badge variant="secondary" className="gap-1 py-1.5 px-3">
          <XCircle className="h-3.5 w-3.5" />
          غائب: {absentCount}
        </Badge>
      </div>

      <div className="space-y-3">
        {session.students.map((student: any) => {
          const studentIdValue = student.studentId?._id || student.studentId;
          const studentName = student.studentId?.name || "طالب";
          const data = formData[studentIdValue];

          if (!data) return null;

          const totalGradesMark = data.sessionGrades.reduce((sum, g) => sum + g.mark, 0);

          return (
            <Card
              key={studentIdValue}
              className={data.present ? "border-green-200 bg-green-50/50" : "border-red-100 bg-red-50/30"}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {data.present ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span>{studentName}</span>
                  </div>
                  <Switch
                    checked={data.present}
                    onCheckedChange={() => togglePresence(studentIdValue)}
                  />
                </CardTitle>
              </CardHeader>
              {data.present && (
                <CardContent className="space-y-4 pt-0">
                  {/* Session Grades - Editable */}
                  {data.sessionGrades.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">درجات الجلسة</Label>
                      <div className="grid gap-3">
                        {data.sessionGrades.map((grade, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <Label className="flex-1 text-sm">{grade.gradeName}</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max={grade.fullMark}
                                value={grade.mark}
                                onChange={(e) =>
                                  updateSessionGrade(
                                    studentIdValue,
                                    idx,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-20 h-9 text-center"
                              />
                              <span className="text-sm text-muted-foreground">
                                / {grade.fullMark}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bonus Mark */}
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <Label className="flex-1 text-sm">درجة المكافأة</Label>
                    <Input
                      type="number"
                      min="0"
                      value={data.bonusMark}
                      onChange={(e) =>
                        updateStudentData(studentIdValue, {
                          bonusMark: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-20 h-9 text-center"
                    />
                  </div>

                  {/* Total and Save */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <span className="text-sm text-muted-foreground">الإجمالي: </span>
                      <span className="text-lg font-bold text-primary">
                        {totalGradesMark + data.bonusMark}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => saveStudent(studentIdValue)}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="h-4 w-4 ml-2" />
                      حفظ
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
