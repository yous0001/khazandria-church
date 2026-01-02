"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, Shield, Mail, Phone, Trash2, AlertTriangle, KeyRound } from "lucide-react";
import { CreateUserDialog } from "@/components/dialogs/create-user-dialog";
import { CreateActivityDialog } from "@/components/dialogs/create-activity-dialog";
import { UpdateUserPasswordDialog } from "@/components/dialogs/update-user-password-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import type { User, Activity } from "@/types/domain";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; activity: Activity | null }>({
    open: false,
    activity: null,
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => api.users.list(),
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["activities"],
    queryFn: () => api.activities.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (activityId: string) => api.activities.delete(activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("تم حذف النشاط بنجاح");
      setDeleteDialog({ open: false, activity: null });
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء حذف النشاط");
    },
  });

  const superadmins = users?.filter((u) => u.role === "superadmin") || [];
  const admins = users?.filter((u) => u.role === "admin") || [];

  const handleDeleteClick = (activity: Activity) => {
    setDeleteDialog({ open: true, activity });
  };

  const confirmDelete = () => {
    if (deleteDialog.activity) {
      deleteMutation.mutate(deleteDialog.activity._id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">لوحة الإدارة</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users?.length || 0}</p>
              <p className="text-sm text-muted-foreground">مستخدم</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activities?.length || 0}</p>
              <p className="text-sm text-muted-foreground">نشاط</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            المستخدمين
          </TabsTrigger>
          <TabsTrigger value="activities" className="gap-2">
            <BookOpen className="h-4 w-4" />
            الأنشطة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <CreateUserDialog />
          </div>

          {usersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="py-4">
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : users?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <Users className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground text-center">
                  لا يوجد مستخدمين
                </p>
                <CreateUserDialog />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Superadmins Section */}
              {superadmins.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    مديرو النظام
                  </h3>
                  <div className="space-y-2">
                    {superadmins.map((user) => (
                      <UserCard key={user._id} user={user} />
                    ))}
                  </div>
                </div>
              )}

              {/* Admins Section */}
              {admins.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    المشرفين
                  </h3>
                  <div className="space-y-2">
                    {admins.map((user) => (
                      <UserCard key={user._id} user={user} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activities" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <CreateActivityDialog />
          </div>

          {activitiesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="py-4">
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activities?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground text-center">
                  لا يوجد أنشطة
                </p>
                <CreateActivityDialog />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {activities?.map((activity) => (
                <ActivityCard
                  key={activity._id}
                  activity={activity}
                  users={users || []}
                  onDelete={() => handleDeleteClick(activity)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, activity: open ? deleteDialog.activity : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              تأكيد حذف النشاط
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <p>
                هل أنت متأكد من حذف النشاط <strong>"{deleteDialog.activity?.name}"</strong>؟
              </p>
              <p className="text-destructive font-medium">
                سيتم حذف جميع البيانات المرتبطة بهذا النشاط نهائياً:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>جميع المجموعات</li>
                <li>جميع الجلسات والحضور</li>
                <li>جميع درجات الطلاب</li>
                <li>جميع صلاحيات المشرفين</li>
              </ul>
              <p className="text-sm font-medium text-destructive">
                هذا الإجراء لا يمكن التراجع عنه!
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, activity: null })}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف النشاط"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.name}</span>
            <Badge variant={user.role === "superadmin" ? "default" : "secondary"}>
              {user.role === "superadmin" ? "مدير النظام" : "مشرف"}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            {user.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span dir="ltr">{user.email}</span>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span dir="ltr">{user.phone}</span>
              </div>
            )}
          </div>
        </div>
        <UpdateUserPasswordDialog
          user={user}
          trigger={
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <KeyRound className="h-4 w-4" />
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}

function ActivityCard({
  activity,
  users,
  onDelete,
}: {
  activity: Activity;
  users: User[];
  onDelete: () => void;
}) {
  const headAdmin = users.find((u) => u._id === activity.headAdminId);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{activity.name}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">المسؤول:</span>
          <span className="font-medium">{headAdmin?.name || "غير محدد"}</span>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>درجات الجلسة: {activity.sessionGrades.length}</span>
          <span>الدرجات الإجمالية: {activity.globalGrades.length}</span>
        </div>
        {activity.sessionGrades.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {activity.sessionGrades.map((grade) => (
              <Badge key={grade.name} variant="outline" className="text-xs">
                {grade.name}: {grade.fullMark}
              </Badge>
            ))}
          </div>
        )}
        {activity.globalGrades.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {activity.globalGrades.map((grade) => (
              <Badge key={grade.name} variant="secondary" className="text-xs">
                {grade.name}: {grade.fullMark}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
