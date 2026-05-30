"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, BookOpen, Award, Users } from "lucide-react";
import { CreateActivityDialog } from "@/components/dialogs/create-activity-dialog";
import { PageHeader } from "@/components/layout/page-header";
import type { Activity } from "@/types/domain";

export default function ActivitiesPage() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["activities"],
    queryFn: () => api.activities.list(),
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="الأنشطة" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="الأنشطة"
        description="اختر نشاطاً لإدارة مجموعاته وجلساته"
        action={<CreateActivityDialog />}
      />

      {activities?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 gap-4">
            <div className="rounded-full bg-muted p-4">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-center">
              لا توجد أنشطة متاحة
            </p>
            <CreateActivityDialog />
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4 list-none p-0 m-0">
          {activities?.map((activity) => (
            <li key={activity._id}>
            <Link
              href={`/activities/${activity._id}/groups`}
              className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="surface-card-interactive cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">
                    {activity.name}
                  </CardTitle>
                  <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-primary/70" />
                      <span>مكافأة الجلسة: حتى {activity.sessionBonusMax}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-primary/70" />
                      <span>
                        الدرجات الإجمالية: {activity.globalGrades.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
