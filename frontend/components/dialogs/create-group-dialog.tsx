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
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface CreateGroupDialogProps {
  activityId: string;
  trigger?: React.ReactNode;
}

export function CreateGroupDialog({ activityId, trigger }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState("");

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => api.groups.create(activityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", activityId] });
      toast.success("تم إنشاء المجموعة بنجاح");
      resetForm();
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إنشاء المجموعة");
    },
  });

  const resetForm = () => {
    setName("");
    setLabels([]);
    setNewLabel("");
  };

  const addLabel = () => {
    if (newLabel && !labels.includes(newLabel)) {
      setLabels([...labels, newLabel]);
      setNewLabel("");
    }
  };

  const removeLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("يرجى إدخال اسم المجموعة");
      return;
    }
    createMutation.mutate({ name, labels });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 ml-2" />
            مجموعة جديدة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إنشاء مجموعة جديدة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المجموعة *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: الصف الأول"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>التصنيفات (اختياري)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="أضف تصنيف"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLabel())}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon" onClick={addLabel}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {labels.map((label) => (
                  <Badge key={label} variant="secondary" className="gap-1">
                    {label}
                    <button
                      type="button"
                      onClick={() => removeLabel(label)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={createMutation.isPending} className="flex-1">
              {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء المجموعة"}
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


