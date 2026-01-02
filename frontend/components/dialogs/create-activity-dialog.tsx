"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { User, GradeType } from "@/types/domain";

interface CreateActivityDialogProps {
  trigger?: React.ReactNode;
}

export function CreateActivityDialog({ trigger }: CreateActivityDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [headAdminId, setHeadAdminId] = useState("");
  const [sessionBonusMax, setSessionBonusMax] = useState(5);
  const [sessionGrades, setSessionGrades] = useState<GradeType[]>([]);
  const [globalGrades, setGlobalGrades] = useState<GradeType[]>([]);
  const [newSessionGrade, setNewSessionGrade] = useState({ name: "", fullMark: 0 });
  const [newGlobalGrade, setNewGlobalGrade] = useState({ name: "", fullMark: 0 });

  const queryClient = useQueryClient();

  const { data: users } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => api.users.list(),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.activities.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("تم إنشاء النشاط بنجاح");
      resetForm();
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إنشاء النشاط");
    },
  });

  const resetForm = () => {
    setName("");
    setHeadAdminId("");
    setSessionBonusMax(5);
    setSessionGrades([]);
    setGlobalGrades([]);
    setNewSessionGrade({ name: "", fullMark: 0 });
    setNewGlobalGrade({ name: "", fullMark: 0 });
  };

  const addSessionGrade = () => {
    if (newSessionGrade.name && newSessionGrade.fullMark > 0) {
      setSessionGrades([...sessionGrades, { ...newSessionGrade }]);
      setNewSessionGrade({ name: "", fullMark: 0 });
    }
  };

  const addGlobalGrade = () => {
    if (newGlobalGrade.name && newGlobalGrade.fullMark > 0) {
      setGlobalGrades([...globalGrades, { ...newGlobalGrade }]);
      setNewGlobalGrade({ name: "", fullMark: 0 });
    }
  };

  const removeSessionGrade = (index: number) => {
    setSessionGrades(sessionGrades.filter((_, i) => i !== index));
  };

  const removeGlobalGrade = (index: number) => {
    setGlobalGrades(globalGrades.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !headAdminId) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    createMutation.mutate({
      name,
      headAdminId,
      sessionBonusMax,
      sessionGrades,
      globalGrades,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 ml-2" />
            نشاط جديد
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء نشاط جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم النشاط *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مدارس الأحد"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="headAdmin">مسؤول النشاط *</Label>
            <Select value={headAdminId} onValueChange={setHeadAdminId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المسؤول" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.name} ({user.email || user.phone})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionBonusMax">الحد الأقصى لدرجة المكافأة</Label>
            <Input
              id="sessionBonusMax"
              type="number"
              min="0"
              value={sessionBonusMax}
              onChange={(e) => setSessionBonusMax(parseInt(e.target.value) || 0)}
            />
          </div>

          {/* Session Grades */}
          <div className="space-y-2">
            <Label>درجات الجلسة</Label>
            <p className="text-xs text-muted-foreground">
              الدرجات التي يحصل عليها الطالب في كل جلسة (مثال: حفظ، ترتيل، سلوك)
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="اسم الدرجة (مثل: حفظ)"
                value={newSessionGrade.name}
                onChange={(e) =>
                  setNewSessionGrade({ ...newSessionGrade, name: e.target.value })
                }
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="الدرجة"
                min="1"
                value={newSessionGrade.fullMark || ""}
                onChange={(e) =>
                  setNewSessionGrade({
                    ...newSessionGrade,
                    fullMark: parseInt(e.target.value) || 0,
                  })
                }
                className="w-24"
              />
              <Button type="button" variant="outline" size="icon" onClick={addSessionGrade}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {sessionGrades.length > 0 && (
              <div className="space-y-1 mt-2">
                {sessionGrades.map((grade, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-secondary px-3 py-2 rounded-md"
                  >
                    <span>
                      {grade.name} ({grade.fullMark} درجة)
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeSessionGrade(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Global Grades */}
          <div className="space-y-2">
            <Label>الدرجات الإجمالية</Label>
            <p className="text-xs text-muted-foreground">
              الدرجات التي يحصل عليها الطالب مرة واحدة (مثال: امتحان نصف السنة، امتحان آخر السنة)
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="اسم الدرجة (مثل: امتحان)"
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
              />
              <Button type="button" variant="outline" size="icon" onClick={addGlobalGrade}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {globalGrades.length > 0 && (
              <div className="space-y-1 mt-2">
                {globalGrades.map((grade, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-secondary px-3 py-2 rounded-md"
                  >
                    <span>
                      {grade.name} ({grade.fullMark} درجة)
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeGlobalGrade(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {(sessionGrades.length > 0 || globalGrades.length > 0) && (
            <div className="p-3 bg-secondary rounded-lg space-y-2">
              <p className="font-medium text-sm">ملخص الدرجات:</p>
              {sessionGrades.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  درجات الجلسة: {sessionGrades.reduce((sum, g) => sum + g.fullMark, 0)} درجة
                  ({sessionGrades.map(g => g.name).join("، ")})
                </p>
              )}
              {globalGrades.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  الدرجات الإجمالية: {globalGrades.reduce((sum, g) => sum + g.fullMark, 0)} درجة
                  ({globalGrades.map(g => g.name).join("، ")})
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                درجة المكافأة القصوى: {sessionBonusMax} درجة
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={createMutation.isPending} className="flex-1">
              {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء النشاط"}
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

