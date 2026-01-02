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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface CreateUserDialogProps {
  trigger?: React.ReactNode;
}

export function CreateUserDialog({ trigger }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"superadmin" | "admin">("admin");

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => api.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("تم إنشاء المستخدم بنجاح");
      resetForm();
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إنشاء المستخدم");
    },
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setRole("admin");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    if (!email && !phone) {
      toast.error("يرجى إدخال البريد الإلكتروني أو رقم الهاتف");
      return;
    }
    createMutation.mutate({
      name,
      email: email || undefined,
      phone: phone || undefined,
      password,
      role,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <UserPlus className="h-4 w-4 ml-2" />
            مستخدم جديد
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إنشاء مستخدم جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="الاسم الكامل"
              required
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
            <Label htmlFor="password">كلمة المرور *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">الصلاحية *</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "superadmin" | "admin")}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الصلاحية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">مشرف</SelectItem>
                <SelectItem value="superadmin">مدير النظام</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={createMutation.isPending} className="flex-1">
              {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء المستخدم"}
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

