"use client";

import { useState } from "react";
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
import { Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface CreateStudentDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: (student: any) => void;
}

export function CreateStudentDialog({ trigger, onSuccess }: CreateStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => api.students.create(data),
    onSuccess: (student) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("تم إضافة الطالب بنجاح");
      resetForm();
      setOpen(false);
      onSuccess?.(student);
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إضافة الطالب");
    },
  });

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("يرجى إدخال اسم الطالب");
      return;
    }
    createMutation.mutate({
      name,
      phone: phone || undefined,
      email: email || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <UserPlus className="h-4 w-4 ml-2" />
            طالب جديد
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة طالب جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم الطالب *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="الاسم الكامل"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              dir="ltr"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={createMutation.isPending} className="flex-1">
              {createMutation.isPending ? "جاري الإضافة..." : "إضافة الطالب"}
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


