"use client";

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Award } from "lucide-react";
import { toast } from "sonner";
import type { Activity, GlobalGrade, GlobalGradeEntry } from "@/types/domain";

interface EditGlobalGradesDialogProps {
  activityId: string;
  studentId: string;
  studentName: string;
  trigger?: React.ReactNode;
}

export function EditGlobalGradesDialog({
  activityId,
  studentId,
  studentName,
  trigger,
}: EditGlobalGradesDialogProps) {
  const [open, setOpen] = useState(false);
  const [grades, setGrades] = useState<GlobalGradeEntry[]>([]);

  const queryClient = useQueryClient();

  const { data: activity } = useQuery<Activity>({
    queryKey: ["activity", activityId],
    queryFn: () => api.activities.get(activityId),
    enabled: open,
  });

  const { data: existingGrades } = useQuery<GlobalGrade>({
    queryKey: ["global-grades", activityId, studentId],
    queryFn: () => api.globalGrades.get(activityId, studentId),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;

    if (activity && existingGrades) {
      // Use existing grades which should have all grade types initialized
      setTimeout(() => {
        setGrades(existingGrades.grades || []);
      }, 0);
    } else if (activity && !existingGrades) {
      // Fallback: initialize with all grade types
      const initialGrades = activity.globalGrades.map((gradeType) => ({
        gradeName: gradeType.name,
        mark: 0,
        fullMark: gradeType.fullMark,
        status: "not_taken" as const,
      }));
      setTimeout(() => {
        setGrades(initialGrades);
      }, 0);
    }
  }, [activity, existingGrades, open]);

  const updateMutation = useMutation({
    mutationFn: (data: { grades: GlobalGradeEntry[] }) =>
      api.globalGrades.upsert(activityId, studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["global-grades", activityId, studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-summary", activityId, studentId],
      });
      toast.success("تم حفظ الدرجات بنجاح");
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء حفظ الدرجات");
    },
  });

  const handleGradeChange = (gradeName: string, mark: number) => {
    setGrades((prev) =>
      prev.map((g) => (g.gradeName === gradeName ? { ...g, mark } : g))
    );
  };

  const handleStatusChange = (
    gradeName: string,
    status: "not_taken" | "taken"
  ) => {
    setGrades((prev) =>
      prev.map((g) =>
        g.gradeName === gradeName
          ? { ...g, status, mark: status === "not_taken" ? 0 : g.mark }
          : g
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ grades });
  };

  // Only count taken grades in total
  const takenGrades = grades.filter((g) => g.status === "taken");
  const totalMark = takenGrades.reduce((sum, g) => sum + g.mark, 0);
  const totalFullMark = takenGrades.reduce((sum, g) => sum + g.fullMark, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Award className="h-4 w-4 ml-2" />
            الدرجات الإجمالية
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>الدرجات الإجمالية - {studentName}</DialogTitle>
        </DialogHeader>
        {!activity?.globalGrades?.length ? (
          <div className="text-center py-4 text-muted-foreground">
            لا توجد درجات إجمالية محددة لهذا النشاط
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {grades.map((grade) => (
              <div
                key={grade.gradeName}
                className="space-y-3 p-3 border rounded"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">
                    {grade.gradeName}
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {grade.status === "taken"
                        ? "تم أداء الامتحان"
                        : "لم يتم أداء الامتحان"}
                    </span>
                    <Switch
                      checked={grade.status === "taken"}
                      onCheckedChange={(checked) =>
                        handleStatusChange(
                          grade.gradeName,
                          checked ? "taken" : "not_taken"
                        )
                      }
                    />
                  </div>
                </div>
                {grade.status === "taken" && (
                  <div className="space-y-2">
                    <Label className="flex justify-between text-sm">
                      <span>الدرجة</span>
                      <span className="text-muted-foreground">
                        من {grade.fullMark}
                      </span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max={grade.fullMark}
                      value={grade.mark}
                      onChange={(e) =>
                        handleGradeChange(
                          grade.gradeName,
                          Math.min(
                            parseInt(e.target.value) || 0,
                            grade.fullMark
                          )
                        )
                      }
                    />
                  </div>
                )}
              </div>
            ))}

            <div className="flex justify-between py-3 border-t font-semibold">
              <span>المجموع (الامتحانات المأداة فقط)</span>
              <span className="text-primary">
                {totalMark} / {totalFullMark}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? "جاري الحفظ..." : "حفظ الدرجات"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
