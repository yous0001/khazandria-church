"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import type { Group } from "@/types/domain";

interface TransferStudentDialogProps {
  groupId: string;
  activityId: string;
  studentId: string;
  studentName: string;
}

export function TransferStudentDialog({
  groupId,
  activityId,
  studentId,
  studentName,
}: TransferStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState("");
  const queryClient = useQueryClient();

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["groups", activityId],
    queryFn: () => api.groups.list(activityId),
    enabled: open && !!activityId,
  });

  const transferMutation = useMutation({
    mutationFn: (toGroupId: string) =>
      api.enrollments.transfer(groupId, studentId, toGroupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-students", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-students"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("تم نقل الطالب بنجاح");
      setOpen(false);
      setTargetGroupId("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء نقل الطالب");
    },
  });

  const availableGroups =
    groups?.filter((group) => group._id !== groupId) ?? [];

  const handleTransfer = () => {
    if (!targetGroupId) {
      toast.error("يرجى اختيار المجموعة الهدف");
      return;
    }
    transferMutation.mutate(targetGroupId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowRightLeft className="h-4 w-4 ml-2" />
          نقل
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>نقل الطالب إلى مجموعة أخرى</DialogTitle>
          <DialogDescription>
            سيتم نقل &quot;{studentName}&quot; إلى مجموعة جديدة. سجل حضوره ودرجاته
            في هذه المجموعة سيبقى محفوظاً.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>المجموعة الهدف</Label>
          <Select value={targetGroupId} onValueChange={setTargetGroupId}>
            <SelectTrigger>
              <SelectValue placeholder="اختر المجموعة" />
            </SelectTrigger>
            <SelectContent>
              {availableGroups.map((group) => (
                <SelectItem key={group._id} value={group._id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {availableGroups.length === 0 && (
            <p className="text-sm text-muted-foreground">
              لا توجد مجموعات أخرى في هذا النشاط
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!targetGroupId || transferMutation.isPending}
          >
            {transferMutation.isPending ? "جاري النقل..." : "تأكيد النقل"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
