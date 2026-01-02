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
    if (activity && open) {
      const initialGrades = activity.globalGrades.map((gradeType) => {
        const existing = existingGrades?.grades?.find(
          (g) => g.gradeName === gradeType.name
        );
        return {
          gradeName: gradeType.name,
          mark: existing?.mark || 0,
          fullMark: gradeType.fullMark,
        };
      });
      setGrades(initialGrades);
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
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء حفظ الدرجات");
    },
  });

  const handleGradeChange = (gradeName: string, mark: number) => {
    setGrades((prev) =>
      prev.map((g) => (g.gradeName === gradeName ? { ...g, mark } : g))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ grades });
  };

  const totalMark = grades.reduce((sum, g) => sum + g.mark, 0);
  const totalFullMark = grades.reduce((sum, g) => sum + g.fullMark, 0);

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
              <div key={grade.gradeName} className="space-y-2">
                <Label className="flex justify-between">
                  <span>{grade.gradeName}</span>
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
                      Math.min(parseInt(e.target.value) || 0, grade.fullMark)
                    )
                  }
                />
              </div>
            ))}

            <div className="flex justify-between py-3 border-t font-semibold">
              <span>المجموع</span>
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

