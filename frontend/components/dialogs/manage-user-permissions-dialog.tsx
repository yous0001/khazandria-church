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
import { Shield, UserPlus, Trash2, Crown, BookOpen } from "lucide-react";
import { toast } from "sonner";
import type { User, ActivityMembership, Activity } from "@/types/domain";

interface ManageUserPermissionsDialogProps {
  user: User;
  trigger?: React.ReactNode;
}

export function ManageUserPermissionsDialog({
  user,
  trigger,
}: ManageUserPermissionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"head" | "admin">("admin");

  const queryClient = useQueryClient();

  const { data: activities } = useQuery<Activity[]>({
    queryKey: ["activities"],
    queryFn: () => api.activities.list(),
    enabled: open,
  });

  const { data: memberships, isLoading } = useQuery<ActivityMembership[]>({
    queryKey: ["user-activities", user._id],
    queryFn: () => api.users.getActivityMemberships(user._id),
    enabled: open,
  });

  const addPermissionMutation = useMutation({
    mutationFn: ({ activityId, roleInActivity }: { activityId: string; roleInActivity: "head" | "admin" }) =>
      api.users.addActivityPermission(user._id, activityId, roleInActivity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-activities", user._id] });
      toast.success("تم إضافة صلاحية النشاط بنجاح");
      setSelectedActivityId("");
      setSelectedRole("admin");
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إضافة الصلاحية");
    },
  });

  const removePermissionMutation = useMutation({
    mutationFn: (activityId: string) =>
      api.users.removeActivityPermission(user._id, activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-activities", user._id] });
      toast.success("تم إزالة صلاحية النشاط بنجاح");
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إزالة الصلاحية");
    },
  });

  const membershipActivityIds = memberships?.map((m) => {
    if (typeof m.activityId === "string") {
      return m.activityId;
    }
    const activity = m.activityId as Activity;
    return activity._id;
  }) || [];

  const availableActivities = activities?.filter(
    (activity) => !membershipActivityIds.includes(activity._id)
  ) || [];

  const handleAddPermission = () => {
    if (!selectedActivityId) {
      toast.error("يرجى اختيار نشاط");
      return;
    }
    addPermissionMutation.mutate({
      activityId: selectedActivityId,
      roleInActivity: selectedRole,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            إدارة صلاحيات {user.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Add Activity Permission */}
          <div className="space-y-2">
            <Label>إضافة صلاحية نشاط</Label>
            <div className="space-y-2">
              <Select value={selectedActivityId} onValueChange={setSelectedActivityId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نشاط" />
                </SelectTrigger>
                <SelectContent>
                  {availableActivities.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      لا توجد أنشطة متاحة
                    </div>
                  ) : (
                    availableActivities.map((activity) => (
                      <SelectItem key={activity._id} value={activity._id}>
                        {activity.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedActivityId && (
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as "head" | "admin")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">مشرف</SelectItem>
                    <SelectItem value="head">مسؤول</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button
                onClick={handleAddPermission}
                disabled={!selectedActivityId || addPermissionMutation.isPending}
                className="w-full"
              >
                <UserPlus className="h-4 w-4 ml-2" />
                {addPermissionMutation.isPending ? "جاري الإضافة..." : "إضافة صلاحية"}
              </Button>
            </div>
          </div>

          {/* Current Permissions */}
          <div className="space-y-2">
            <Label>الصلاحيات الحالية</Label>
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                جاري التحميل...
              </div>
            ) : memberships?.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                لا توجد صلاحيات
              </div>
            ) : (
              <div className="space-y-2">
                {memberships?.map((membership) => {
                  let activity: Activity | undefined;
                  let activityId: string;
                  
                  if (typeof membership.activityId === "string") {
                    activityId = membership.activityId;
                    activity = activities?.find((a) => a._id === activityId);
                  } else {
                    activity = membership.activityId as Activity;
                    activityId = activity._id;
                  }
                  
                  const isHead = membership.roleInActivity === "head";

                  return (
                    <Card key={membership._id}>
                      <CardContent className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2 flex-1">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {activity?.name || "نشاط غير معروف"}
                          </span>
                          {isHead ? (
                            <Badge variant="default" className="gap-1">
                              <Crown className="h-3 w-3" />
                              مسؤول
                            </Badge>
                          ) : (
                            <Badge variant="secondary">مشرف</Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("هل أنت متأكد من إزالة هذه الصلاحية؟")) {
                              removePermissionMutation.mutate(activityId);
                            }
                          }}
                          disabled={removePermissionMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

