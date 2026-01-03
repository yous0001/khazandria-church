"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import { Plus, Calendar } from "lucide-react";
import { toast } from "sonner";

interface CreateSessionDialogProps {
  groupId: string;
  trigger?: React.ReactNode;
}

export function CreateSessionDialog({ groupId, trigger }: CreateSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [initializeStudents, setInitializeStudents] = useState(true);

  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => api.sessions.create(groupId, data),
    onSuccess: (session: any) => {
      queryClient.invalidateQueries({ queryKey: ["sessions", groupId] });
      toast.success("تم إنشاء الجلسة بنجاح");
      setOpen(false);
      router.push(`/sessions/${session._id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إنشاء الجلسة");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionDate) {
      toast.error("يرجى اختيار تاريخ الجلسة");
      return;
    }
    createMutation.mutate({
      sessionDate: new Date(sessionDate).toISOString(),
      initializeStudents,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 ml-2" />
            جلسة جديدة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إنشاء جلسة جديدة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionDate">تاريخ الجلسة *</Label>
            <div className="relative">
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="sessionDate"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="pr-9"
                required
                dir="ltr"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="initializeStudents"
              checked={initializeStudents}
              onCheckedChange={(checked) => setInitializeStudents(checked === true)}
            />
            <Label htmlFor="initializeStudents" className="cursor-pointer">
              إضافة جميع طلاب المجموعة تلقائياً
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={createMutation.isPending} className="flex-1">
              {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الجلسة"}
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


