"use client";

import { useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { CreateStudentDialog } from "./create-student-dialog";
import type { Activity, Student } from "@/types/domain";

interface EnrollStudentDialogProps {
  groupId: string;
  activityId: string;
  trigger?: React.ReactNode;
}

export function EnrollStudentDialog({
  groupId,
  activityId,
  trigger,
}: EnrollStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();

  const { data: activity } = useQuery<Activity>({
    queryKey: ["activity", activityId],
    queryFn: () => api.activities.get(activityId),
    enabled: open && !!activityId,
  });

  const { data: groupStudents } = useQuery({
    queryKey: ["group-students", groupId],
    queryFn: () => api.enrollments.list(groupId),
    enabled: open,
  });

  const { data: enrollmentSummary } = useQuery({
    queryKey: ["enrollment-summary"],
    queryFn: () => api.enrollments.enrollmentSummary(),
    enabled: open,
  });

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["students", search],
    queryFn: () => api.students.list(search),
    enabled: open,
  });

  const enrolledInThisGroup = useMemo(() => {
    const ids = new Set<string>();
    for (const enrollment of groupStudents ?? []) {
      const sid =
        typeof enrollment.studentId === "string"
          ? enrollment.studentId
          : enrollment.studentId?._id;
      if (sid) ids.add(sid);
    }
    return ids;
  }, [groupStudents]);

  const enrolledInActivity = useMemo(() => {
    const ids = new Set<string>();
    if (!enrollmentSummary) return ids;
    for (const [studentId, enrollments] of Object.entries(enrollmentSummary)) {
      if (enrollments.some((e) => e.activityId === activityId)) {
        ids.add(studentId);
      }
    }
    return ids;
  }, [enrollmentSummary, activityId]);

  const allowMultipleGroups = activity?.allowMultipleGroups === true;

  const isAlreadyEnrolled = (studentId: string): boolean => {
    if (enrolledInThisGroup.has(studentId)) return true;
    if (!allowMultipleGroups && enrolledInActivity.has(studentId)) {
      return true;
    }
    return false;
  };

  const enrollMutation = useMutation({
    mutationFn: (studentIds: string[]) =>
      api.enrollments.enrollBulk(groupId, studentIds),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["group-students", groupId] });
      queryClient.invalidateQueries({ queryKey: ["enrollment-summary"] });
      const enrolledCount = result.enrolled.length;
      const skippedCount = result.skipped.length;

      if (enrolledCount > 0) {
        toast.success(
          skippedCount > 0
            ? `تم تسجيل ${enrolledCount} طالب، تم تخطي ${skippedCount}`
            : `تم تسجيل ${enrolledCount} طالب بنجاح`
        );
      } else {
        const reason = result.skipped[0]?.reason;
        toast.error(
          reason ?? "لم يتم تسجيل أي طالب"
        );
      }

      setSelectedIds(new Set());
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء تسجيل الطلاب");
    },
  });

  const toggleStudent = (studentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const selectAllVisible = () => {
    const ids =
      students
        ?.filter((s) => !isAlreadyEnrolled(s._id))
        .map((s) => s._id) ?? [];
    setSelectedIds(new Set(ids));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleEnroll = () => {
    if (selectedIds.size === 0) {
      toast.error("يرجى اختيار طالب واحد على الأقل");
      return;
    }
    enrollMutation.mutate(Array.from(selectedIds));
  };

  const handleStudentCreated = (student: Student) => {
    if (!isAlreadyEnrolled(student._id)) {
      setSelectedIds((prev) => new Set(prev).add(student._id));
    }
    queryClient.invalidateQueries({ queryKey: ["students"] });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSelectedIds(new Set());
          setSearch("");
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 ml-2" />
            إضافة طلاب
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة طلاب للمجموعة</DialogTitle>
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

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} محدد
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllVisible}
                disabled={
                  !students?.some((s) => !isAlreadyEnrolled(s._id))
                }
              >
                تحديد الكل
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                disabled={selectedIds.size === 0}
              >
                إلغاء التحديد
              </Button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                جاري البحث...
              </div>
            ) : students?.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                لا يوجد طلاب. أضف طالباً جديداً.
              </div>
            ) : (
              (students ?? []).map((student) => {
                const disabled = isAlreadyEnrolled(student._id);
                const checked = selectedIds.has(student._id);

                return (
                  <Card
                    key={student._id}
                    className={`transition-colors ${
                      disabled
                        ? "opacity-50 cursor-not-allowed"
                        : checked
                          ? "border-primary bg-primary/5 cursor-pointer"
                          : "hover:bg-accent cursor-pointer"
                    }`}
                    onClick={() => !disabled && toggleStudent(student._id)}
                  >
                    <CardContent className="flex items-center gap-3 py-3">
                      <Checkbox
                        checked={checked}
                        disabled={disabled}
                        onCheckedChange={() =>
                          !disabled && toggleStudent(student._id)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{student.name}</p>
                        {(student.phone || student.email) && (
                          <p className="text-sm text-muted-foreground truncate">
                            {student.phone || student.email}
                          </p>
                        )}
                        {disabled && (
                          <p className="text-xs text-muted-foreground mt-1">
                            مسجل مسبقاً
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleEnroll}
              disabled={selectedIds.size === 0 || enrollMutation.isPending}
              className="flex-1"
            >
              {enrollMutation.isPending
                ? "جاري التسجيل..."
                : `تسجيل (${selectedIds.size})`}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
