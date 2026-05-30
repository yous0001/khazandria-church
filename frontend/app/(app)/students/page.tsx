"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Mail, Phone, Trash2 } from "lucide-react";
import { CreateStudentDialog } from "@/components/dialogs/create-student-dialog";
import { UpdateStudentDialog } from "@/components/dialogs/update-student-dialog";
import { ExportStudentsDialog } from "@/components/dialogs/export-students-dialog";
import { StudentReportButton } from "@/components/students/student-report-button";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "sonner";
import type { Student } from "@/types/domain";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0);
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`;
}

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["students", search],
    queryFn: () => api.students.list(search),
  });

  const { data: enrollmentSummary } = useQuery({
    queryKey: ["enrollment-summary"],
    queryFn: () => api.enrollments.enrollmentSummary(),
    staleTime: 2 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: (studentId: string) => api.students.delete(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("تم حذف الطالب بنجاح");
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء حذف الطالب");
    },
  });

  const handleDelete = (studentId: string, studentName: string) => {
    if (
      confirm(
        `هل أنت متأكد من حذف الطالب "${studentName}"؟\n\nملاحظة: لا يمكن حذف الطالب إذا كان مسجلاً في مجموعات أو لديه سجلات جلسات.`
      )
    ) {
      deleteMutation.mutate(studentId);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="الطلاب"
        description="إدارة سجلات الطلاب ومتابعة تقاريرهم عبر جميع الأنشطة"
        action={
          <div className="flex items-center gap-2">
            <ExportStudentsDialog />
            <CreateStudentDialog />
          </div>
        }
      />

      <Card className="surface-card">
        <CardContent className="py-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث بالاسم أو الهاتف أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 bg-background"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-5">
                <div className="h-6 bg-muted rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : students?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 gap-4">
            <div className="rounded-full bg-muted p-4">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-center">
              {search ? "لا توجد نتائج للبحث" : "لا يوجد طلاب مسجلين"}
            </p>
            {!search && <CreateStudentDialog />}
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4 list-none p-0 m-0">
          {students?.map((student) => {
            const enrollments = enrollmentSummary?.[student._id] ?? [];

            return (
              <li key={student._id}>
              <Card className="surface-card-interactive">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm"
                        aria-hidden
                      >
                        {getInitials(student.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{student.name}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                          {student.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span dir="ltr">{student.phone}</span>
                            </div>
                          )}
                          {student.email && (
                            <div className="flex items-center gap-1 min-w-0">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span dir="ltr" className="truncate">
                                {student.email}
                              </span>
                            </div>
                          )}
                        </div>
                        {enrollments.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            {enrollments
                              .map(
                                (e) =>
                                  `${e.groupName} · ${e.activityName}`
                              )
                              .join("  |  ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <StudentReportButton
                        studentId={student._id}
                        enrollments={enrollments}
                      />
                      <UpdateStudentDialog student={student} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(student._id, student.name)}
                        disabled={deleteMutation.isPending}
                        title="حذف الطالب"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
