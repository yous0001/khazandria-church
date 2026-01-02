"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, BookOpen, Award, Users } from "lucide-react";
import { CreateActivityDialog } from "@/components/dialogs/create-activity-dialog";
import type { Activity } from "@/types/domain";

export default function ActivitiesPage() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["activities"],
    queryFn: () => api.activities.list(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">الأنشطة</h2>
        <CreateActivityDialog />
      </div>

      {activities?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              لا توجد أنشطة متاحة
            </p>
            <CreateActivityDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activities?.map((activity) => (
            <Link key={activity._id} href={`/activities/${activity._id}/groups`}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">
                    {activity.name}
                  </CardTitle>
                  <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      <span>درجات الجلسة: {activity.sessionGrades.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>الدرجات الإجمالية: {activity.globalGrades.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

