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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Settings, UserPlus, Trash2, Crown } from "lucide-react";
import { toast } from "sonner";
import type { User, ActivityMembership } from "@/types/domain";

interface ManageActivityAdminsDialogProps {
  activityId: string;
  activityName: string;
  headAdminId: string;
  trigger?: React.ReactNode;
}

export function ManageActivityAdminsDialog({
  activityId,
  activityName,
  headAdminId,
  trigger,
}: ManageActivityAdminsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const queryClient = useQueryClient();

  const { data: users } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => api.users.list(),
    enabled: open,
  });

  const { data: admins, isLoading } = useQuery<any[]>({
    queryKey: ["activity-admins", activityId],
    queryFn: () => api.admin.listAdmins(activityId),
    enabled: open,
  });

  const addAdminMutation = useMutation({
    mutationFn: (userId: string) => api.admin.addAdmin(activityId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-admins", activityId] });
      toast.success("تم إضافة المشرف بنجاح");
      setSelectedUserId("");
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إضافة المشرف");
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: (userId: string) => api.admin.removeAdmin(activityId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-admins", activityId] });
      toast.success("تم إزالة المشرف بنجاح");
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إزالة المشرف");
    },
  });

  const changeHeadMutation = useMutation({
    mutationFn: (userId: string) => api.admin.changeHead(activityId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["activity-admins", activityId] });
      toast.success("تم تغيير مسؤول النشاط بنجاح");
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء تغيير المسؤول");
    },
  });

  const adminUserIds = admins?.map((a: any) => a.userId?._id || a.userId) || [];
  const availableUsers = users?.filter((u) => !adminUserIds.includes(u._id)) || [];

  const handleAddAdmin = () => {
    if (!selectedUserId) {
      toast.error("يرجى اختيار مستخدم");
      return;
    }
    addAdminMutation.mutate(selectedUserId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 ml-2" />
            إدارة المشرفين
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إدارة مشرفي {activityName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Add Admin */}
          <div className="space-y-2">
            <Label>إضافة مشرف جديد</Label>
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="اختر مستخدم" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddAdmin}
                disabled={!selectedUserId || addAdminMutation.isPending}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Current Admins */}
          <div className="space-y-2">
            <Label>المشرفون الحاليون</Label>
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                جاري التحميل...
              </div>
            ) : admins?.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                لا يوجد مشرفون
              </div>
            ) : (
              <div className="space-y-2">
                {admins?.map((admin: any) => {
                  const user = admin.userId;
                  const userId = user?._id || admin.userId;
                  const isHead = userId === headAdminId;

                  return (
                    <Card key={admin._id}>
                      <CardContent className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user?.name || "مستخدم"}</span>
                          {isHead && (
                            <Badge variant="default" className="gap-1">
                              <Crown className="h-3 w-3" />
                              مسؤول
                            </Badge>
                          )}
                          {admin.roleInActivity === "admin" && !isHead && (
                            <Badge variant="secondary">مشرف</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!isHead && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  if (confirm("هل تريد جعل هذا المستخدم مسؤول النشاط؟")) {
                                    changeHeadMutation.mutate(userId);
                                  }
                                }}
                                title="تعيين كمسؤول"
                              >
                                <Crown className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (confirm("هل أنت متأكد من إزالة هذا المشرف؟")) {
                                    removeAdminMutation.mutate(userId);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <Button variant="outline" onClick={() => setOpen(false)} className="w-full">
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

