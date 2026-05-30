"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import type { Activity, GradeType } from "@/types/domain";

interface EditActivityExamsDialogProps {
  activityId: string;
  trigger?: React.ReactNode;
}

export function EditActivityExamsDialog({
  activityId,
  trigger,
}: EditActivityExamsDialogProps) {
  const [open, setOpen] = useState(false);
  const [globalGrades, setGlobalGrades] = useState<GradeType[]>([]);
  const [newGlobalGrade, setNewGlobalGrade] = useState({ name: "", fullMark: 0 });

  const queryClient = useQueryClient();

  const { data: activity } = useQuery<Activity>({
    queryKey: ["activity", activityId],
    queryFn: () => api.activities.get(activityId),
    enabled: open && !!activityId,
  });

  useEffect(() => {
    if (open && activity) {
      setGlobalGrades(activity.globalGrades.map((g) => ({ ...g })));
      setNewGlobalGrade({ name: "", fullMark: 0 });
    }
  }, [open, activity]);

  const updateMutation = useMutation({
    mutationFn: (grades: GradeType[]) =>
      api.activities.update(activityId, { globalGrades: grades }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity", activityId] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("تم تحديث الامتحانات بنجاح");
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء تحديث الامتحانات");
    },
  });

  const addGlobalGrade = () => {
    const name = newGlobalGrade.name.trim();
    if (!name || newGlobalGrade.fullMark <= 0) {
      toast.error("يرجى إدخال اسم الامتحان ودرجة صحيحة");
      return;
    }

    if (globalGrades.some((g) => g.name === name)) {
      toast.error("يوجد امتحان بنفس الاسم");
      return;
    }

    setGlobalGrades([...globalGrades, { name, fullMark: newGlobalGrade.fullMark }]);
    setNewGlobalGrade({ name: "", fullMark: 0 });
  };

  const removeGlobalGrade = (index: number) => {
    setGlobalGrades(globalGrades.filter((_, i) => i !== index));
  };

  const updateFullMark = (index: number, fullMark: number) => {
    setGlobalGrades(
      globalGrades.map((grade, i) =>
        i === index ? { ...grade, fullMark } : grade
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(globalGrades);
  };

  const hasChanges =
    activity &&
    JSON.stringify(activity.globalGrades) !== JSON.stringify(globalGrades);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            إدارة الامتحانات
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إدارة امتحانات النشاط</DialogTitle>
          <DialogDescription>
            {activity?.name
              ? `إضافة أو تعديل امتحانات "${activity.name}" بعد إنشائه`
              : "إضافة امتحانات جديدة للنشاط"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>الامتحانات الحالية</Label>
            {globalGrades.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-secondary rounded-lg p-3">
                لا توجد امتحانات بعد. أضف امتحاناً جديداً أدناه.
              </p>
            ) : (
              <div className="space-y-2">
                {globalGrades.map((grade, index) => (
                  <div
                    key={`${grade.name}-${index}`}
                    className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-md"
                  >
                    <span className="flex-1 font-medium">{grade.name}</span>
                    <Input
                      type="number"
                      min="1"
                      value={grade.fullMark}
                      onChange={(e) =>
                        updateFullMark(index, parseInt(e.target.value) || 0)
                      }
                      className="w-20 h-8"
                      dir="ltr"
                    />
                    <span className="text-xs text-muted-foreground">درجة</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => removeGlobalGrade(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label>إضافة امتحان جديد</Label>
            <div className="flex gap-2">
              <Input
                placeholder="اسم الامتحان (مثل: امتحان نصف السنة)"
                value={newGlobalGrade.name}
                onChange={(e) =>
                  setNewGlobalGrade({ ...newGlobalGrade, name: e.target.value })
                }
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="الدرجة"
                min="1"
                value={newGlobalGrade.fullMark || ""}
                onChange={(e) =>
                  setNewGlobalGrade({
                    ...newGlobalGrade,
                    fullMark: parseInt(e.target.value) || 0,
                  })
                }
                className="w-24"
                dir="ltr"
              />
              <Button type="button" variant="outline" size="icon" onClick={addGlobalGrade}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {globalGrades.length > 0 && (
            <div className="p-3 bg-secondary rounded-lg text-sm text-muted-foreground">
              المجموع: {globalGrades.reduce((sum, g) => sum + g.fullMark, 0)} درجة
              {" — "}
              {globalGrades.map((g) => g.name).join("، ")}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            عند إضافة امتحان جديد، يظهر تلقائياً لجميع الطلاب في النشاط. لا يمكن
            حذف امتحان تم تسجيل درجات فيه.
          </p>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={updateMutation.isPending || !hasChanges}
              className="flex-1"
            >
              {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
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
      </DialogContent>
    </Dialog>
  );
}
