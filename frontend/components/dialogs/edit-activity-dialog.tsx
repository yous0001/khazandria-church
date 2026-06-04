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
import { Switch } from "@/components/ui/switch";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Activity } from "@/types/domain";

interface EditActivityDialogProps {
  activityId: string;
  trigger?: React.ReactNode;
}

export function EditActivityDialog({
  activityId,
  trigger,
}: EditActivityDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sessionBonusMax, setSessionBonusMax] = useState(5);
  const [allowMultipleGroups, setAllowMultipleGroups] = useState(false);

  const queryClient = useQueryClient();

  const { data: activity } = useQuery<Activity>({
    queryKey: ["activity", activityId],
    queryFn: () => api.activities.get(activityId),
    enabled: open && !!activityId,
  });

  useEffect(() => {
    if (open && activity) {
      setName(activity.name);
      setSessionBonusMax(activity.sessionBonusMax);
      setAllowMultipleGroups(activity.allowMultipleGroups ?? false);
    }
  }, [open, activity]);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.activities.update(activityId, {
        name,
        sessionBonusMax,
        allowMultipleGroups,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity", activityId] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("تم تحديث النشاط بنجاح");
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء تحديث النشاط");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("يرجى إدخال اسم النشاط");
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Pencil className="h-4 w-4" />
            تعديل النشاط
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تعديل النشاط</DialogTitle>
          <DialogDescription>
            تحديث اسم النشاط وإعدادات الجلسات والتسجيل في المجموعات
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activityName">اسم النشاط</Label>
            <Input
              id="activityName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionBonusMax">الحد الأقصى لمكافأة الجلسة (0–5)</Label>
            <Input
              id="sessionBonusMax"
              type="number"
              min={0}
              max={5}
              value={sessionBonusMax}
              onChange={(e) =>
                setSessionBonusMax(
                  Math.min(5, Math.max(0, parseInt(e.target.value) || 0))
                )
              }
              dir="ltr"
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="allowMultipleGroups">مجموعات متعددة للطالب</Label>
              <p className="text-xs text-muted-foreground">
                عند التفعيل يمكن للطالب الانضمام لأكثر من مجموعة في نفس النشاط
              </p>
            </div>
            <Switch
              id="allowMultipleGroups"
              checked={allowMultipleGroups}
              onCheckedChange={setAllowMultipleGroups}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
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
