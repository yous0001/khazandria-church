"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Edit } from "lucide-react";
import { toast } from "sonner";
import type { Student } from "@/types/domain";

interface UpdateStudentDialogProps {
  student: Student;
  trigger?: React.ReactNode;
  onSuccess?: (student: Student) => void;
}

export function UpdateStudentDialog({
  student,
  trigger,
  onSuccess,
}: UpdateStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const queryClient = useQueryClient();

  // Initialize form with student data
  useEffect(() => {
    if (student && open) {
      setName(student.name || "");
      setPhone(student.phone || "");
      setEmail(student.email || "");
    }
  }, [student, open]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.students.update(student._id, data),
    onSuccess: (updatedStudent) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("تم تحديث بيانات الطالب بنجاح");
      setOpen(false);
      onSuccess?.(updatedStudent);
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء تحديث بيانات الطالب");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("يرجى إدخال اسم الطالب");
      return;
    }
    updateMutation.mutate({
      name,
      phone: phone || undefined,
      email: email || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8" title="تعديل بيانات الطالب">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل بيانات الطالب</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="update-name">اسم الطالب *</Label>
            <Input
              id="update-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="الاسم الكامل"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="update-phone">رقم الهاتف</Label>
            <Input
              id="update-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="update-email">البريد الإلكتروني</Label>
            <Input
              id="update-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              dir="ltr"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={updateMutation.isPending} className="flex-1">
              {updateMutation.isPending ? "جاري التحديث..." : "حفظ التغييرات"}
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

