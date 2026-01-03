"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";
import { CreateStudentDialog } from "./create-student-dialog";
import type { Student } from "@/types/domain";

interface EnrollStudentDialogProps {
  groupId: string;
  trigger?: React.ReactNode;
}

export function EnrollStudentDialog({ groupId, trigger }: EnrollStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["students", search],
    queryFn: () => api.students.list(search),
    enabled: open,
  });

  const enrollMutation = useMutation({
    mutationFn: (studentId: string) => api.enrollments.enroll(groupId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-students", groupId] });
      toast.success("تم تسجيل الطالب بنجاح");
      setSelectedStudent(null);
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء تسجيل الطالب");
    },
  });

  const handleEnroll = () => {
    if (!selectedStudent) {
      toast.error("يرجى اختيار طالب");
      return;
    }
    enrollMutation.mutate(selectedStudent);
  };

  const handleStudentCreated = (student: any) => {
    setSelectedStudent(student._id);
    queryClient.invalidateQueries({ queryKey: ["students"] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 ml-2" />
            إضافة طالب
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة طالب للمجموعة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن طالب..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <CreateStudentDialog
              trigger={
                <Button variant="outline" size="icon">
                  <UserPlus className="h-4 w-4" />
                </Button>
              }
              onSuccess={handleStudentCreated}
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">جاري البحث...</div>
            ) : students?.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                لا يوجد طلاب. أضف طالب جديد.
              </div>
            ) : (
              students?.map((student) => (
                <Card
                  key={student._id}
                  className={`cursor-pointer transition-colors ${
                    selectedStudent === student._id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => setSelectedStudent(student._id)}
                >
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      {(student.phone || student.email) && (
                        <p className="text-sm text-muted-foreground">
                          {student.phone || student.email}
                        </p>
                      )}
                    </div>
                    {selectedStudent === student._id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleEnroll}
              disabled={!selectedStudent || enrollMutation.isPending}
              className="flex-1"
            >
              {enrollMutation.isPending ? "جاري التسجيل..." : "تسجيل الطالب"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


