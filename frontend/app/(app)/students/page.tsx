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
import { toast } from "sonner";
import type { Student } from "@/types/domain";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["students", search],
    queryFn: () => api.students.list(search),
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">الطلاب</h2>
        <CreateStudentDialog />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ابحث عن طالب..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-4">
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : students?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <Users className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              {search ? "لا توجد نتائج للبحث" : "لا يوجد طلاب مسجلين"}
            </p>
            {!search && <CreateStudentDialog />}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {students?.map((student) => (
            <Card key={student._id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{student.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      {student.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span dir="ltr">{student.phone}</span>
                        </div>
                      )}
                      {student.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span dir="ltr">{student.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <UpdateStudentDialog student={student} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
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
          ))}
        </div>
      )}
    </div>
  );
}


