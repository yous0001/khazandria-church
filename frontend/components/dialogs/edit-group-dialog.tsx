"use client";

import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { Group } from "@/types/domain";

interface EditGroupDialogProps {
  groupId: string;
  activityId?: string;
  trigger?: React.ReactNode;
}

export function EditGroupDialog({
  groupId,
  activityId,
  trigger,
}: EditGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState("");

  const queryClient = useQueryClient();

  const { data: group } = useQuery<Group>({
    queryKey: ["group", groupId],
    queryFn: () => api.groups.get(groupId),
    enabled: open && !!groupId,
  });

  useEffect(() => {
    if (open && group) {
      setName(group.name);
      setLabels([...group.labels]);
      setNewLabel("");
    }
  }, [open, group]);

  const updateMutation = useMutation({
    mutationFn: () => api.groups.update(groupId, { name, labels }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      if (activityId) {
        queryClient.invalidateQueries({ queryKey: ["groups", activityId] });
      }
      toast.success("تم تحديث المجموعة بنجاح");
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء تحديث المجموعة");
    },
  });

  const addLabel = () => {
    const trimmed = newLabel.trim();
    if (trimmed && !labels.includes(trimmed)) {
      setLabels([...labels, trimmed]);
      setNewLabel("");
    }
  };

  const removeLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("يرجى إدخال اسم المجموعة");
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon" title="تعديل المجموعة">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل المجموعة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">اسم المجموعة</Label>
            <Input
              id="groupName"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLabel();
                  }
                }}
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
